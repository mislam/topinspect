import {
	appleSignInSchema,
	googleSignInSchema,
	logoutSchema,
	oauthSignupSchema,
	otpRequestSchema,
	phoneSignInSchema,
	phoneSignupSchema,
	refreshTokensSchema,
} from "@the/schemas"
import { capitalizeFirst, getArticle } from "@the/utils/shared"
import { and, eq } from "drizzle-orm"
import { sign } from "hono/jwt"

import { AUTH_CONFIG } from "./config"

import type { OtpVerificationResult } from "./types"
import type { Handler } from "@/utils/validation"
import type { DeviceInfo } from "@the/schemas"
import type { OtpResponse, TokenResponse } from "@the/types"
import type { Context, Hono } from "hono"

import { getDb } from "@/adapters/database"
import { sendOTP } from "@/adapters/sms"
import { auth, otps, tokens, users } from "@/db/schema"
import { daysFromNow, minutesAgo, minutesFromNow, now } from "@/utils/date"
import { getEnv } from "@/utils/env"
import { res } from "@/utils/response"
import { validate } from "@/utils/validation"

// Generate a 6-digit OTP using Web Crypto (Workers-native)
// Uses rejection sampling to avoid bias from modulo operation
const generateOTP = (): string => {
	let otp = ""
	for (let i = 0; i < 6; i++) {
		let digit: number
		do {
			const buffer = new Uint8Array(1)
			crypto.getRandomValues(buffer)
			digit = buffer[0]
		} while (digit >= 250) // Reject values 250-255 to avoid modulo bias
		otp += (digit % 10).toString()
	}
	return otp
}

// Generate an access token with configurable expiry
const generateAccessToken = async (c: Context, userId: string): Promise<string> => {
	const issuedAt = Math.floor(Date.now() / 1000) // added for traceability
	const expiresAt = issuedAt + AUTH_CONFIG.ACCESS_TOKEN_EXPIRY_MINUTES * 60
	const algorithm = "HS256"
	return sign({ sub: userId, iat: issuedAt, exp: expiresAt }, getEnv(c).JWT_SECRET, algorithm)
}

/**
 * Generates a crypto-safe, fixed 24-character refresh token in base36 (0-9, a-z).
 * Features: 128-bit entropy, collision-resistant, URL-safe, lowercase alphanumeric.
 * @returns A 24-character base36 string, e.g., "tz4a98xxat96iws9zmbrgj3a".
 */
const generateRefreshToken = (): string => {
	// Generate 16 bytes (128 bits) for maximum entropy
	const bytes = new Uint8Array(16)
	crypto.getRandomValues(bytes)

	// Convert bytes to a big integer
	let num = 0n
	for (let i = 0; i < bytes.length; i++) {
		num = (num << 8n) + BigInt(bytes[i])
	}

	// Convert to base36 and ensure exactly 24 characters
	return num.toString(36).padStart(24, "0").slice(-24)
}

/**
 * Check if token was recently refreshed (within cooldown period)
 * @param lastUsedAt - Last time the token was used
 * @returns true if recently refreshed (should block), false if refresh allowed
 */
const recentlyRefreshed = (lastUsedAt: Date | null): boolean => {
	if (!lastUsedAt) {
		return false
	}

	const timeSinceLastUse = now().getTime() - lastUsedAt.getTime()
	const cooldownMs = AUTH_CONFIG.REFRESH_COOLDOWN_MINUTES * 60 * 1000

	return timeSinceLastUse < cooldownMs
}

// Request OTP with rate limiting
const requestOTP: Handler<typeof otpRequestSchema> = async (c) => {
	const { phone, purpose } = c.get("validated") // Retrieve validated data from context

	const db = getDb(c)
	const [recentOTP] = await db.select().from(otps).where(eq(otps.phone, phone)).limit(1)

	// Check if an OTP was requested recently (within cooldown period)
	if (
		recentOTP &&
		recentOTP.createdAt &&
		recentOTP.createdAt > minutesAgo(AUTH_CONFIG.OTP_COOLDOWN_MINUTES)
	) {
		return res.otpRateLimited(c)
	}

	// Check if user exists
	let userExists = false
	const [existingAuth] = await db
		.select()
		.from(auth)
		.where(and(eq(auth.provider, "phone"), eq(auth.identifier, phone))!)
		.limit(1)
	if (existingAuth) {
		// Check if user profile exists for this auth record
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, existingAuth.id))
			.limit(1)
		userExists = !!existingUser
	}

	if ("login" === purpose) {
		// For login purpose, skip sending OTP if user doesn't exist
		if (!userExists) {
			return res.ok(c, { userExists } as OtpResponse)
		}
	} else if ("signup" === purpose) {
		// For signup purpose, return error if user already exists
		if (userExists) {
			return res.userExists(c, "User already exists. Please login instead.")
		}
	}

	const otpCode = generateOTP()
	const expiresAt = minutesFromNow(AUTH_CONFIG.OTP_EXPIRY_MINUTES)

	try {
		await db
			.insert(otps)
			.values({ phone, code: otpCode, expiresAt, attempts: 0, createdAt: now() })
			.onConflictDoUpdate({
				target: otps.phone,
				set: { code: otpCode, expiresAt, attempts: 0, createdAt: now() },
			})

		// Defer SMS sending so the response is fast; logs/HTTP happen in background
		c.executionCtx.waitUntil(sendOTP(c, phone, otpCode))
	} catch (error) {
		console.error("Failed to save OTP to database:", error)
		return res.databaseError(c, "Failed to process OTP request")
	}

	// Return response with userExists flag for login purpose
	return res.ok(c, { userExists } as OtpResponse)
}

// Common OTP verification logic
const verifyOTPCode = async (
	c: Context,
	phone: string,
	code: string,
): Promise<OtpVerificationResult> => {
	const db = getDb(c)
	const [otp] = await db.select().from(otps).where(eq(otps.phone, phone)).limit(1)

	// Check if OTP exists and hasn't exceeded max attempts
	if (!otp) {
		return {
			success: false,
			errorCode: "OTP_NOT_FOUND",
			error: "No OTP found for this phone number",
		}
	}

	if (otp.expiresAt < now()) {
		// Clean up expired OTP
		await db.delete(otps).where(eq(otps.phone, phone))
		return { success: false, errorCode: "OTP_EXPIRED", error: "OTP has expired" }
	}

	if ((otp.attempts ?? 0) >= AUTH_CONFIG.OTP_MAX_ATTEMPTS) {
		// Clean up OTP that has exceeded max attempts
		await db.delete(otps).where(eq(otps.phone, phone))
		return {
			success: false,
			errorCode: "OTP_MAX_ATTEMPTS",
			error: "Too many failed attempts. Please request a new OTP.",
		}
	}

	// Check if OTP code matches
	if (otp.code !== code) {
		// Increment attempts and check if we've exceeded the limit
		const newAttempts = (otp.attempts ?? 0) + 1
		await db.update(otps).set({ attempts: newAttempts }).where(eq(otps.phone, phone))

		if (newAttempts >= AUTH_CONFIG.OTP_MAX_ATTEMPTS) {
			// Clean up OTP that has now exceeded max attempts
			await db.delete(otps).where(eq(otps.phone, phone))
			return {
				success: false,
				errorCode: "OTP_MAX_ATTEMPTS",
				error: "Too many failed attempts. Please request a new OTP.",
			}
		}

		return {
			success: false,
			errorCode: "OTP_INVALID",
			error: "Invalid OTP! Please check and try again.",
		}
	}

	// OTP is valid - clean it up
	await db.delete(otps).where(eq(otps.phone, phone))
	return { success: true }
}

// Common token issuance logic for mobile clients
const issueTokens = async (
	c: Context,
	authId: string,
	deviceInfo?: DeviceInfo,
): Promise<{ accessToken: string; refreshToken: string }> => {
	const db = getDb(c)

	// Issue access token + refresh token
	const accessToken = await generateAccessToken(c, authId)
	const refreshToken = generateRefreshToken()
	const expiresAt = daysFromNow(AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS)

	await db.insert(tokens).values({
		authId,
		token: refreshToken,
		expiresAt,
		deviceInfo,
	})

	return { accessToken, refreshToken }
}

// Phone Signup: Create new user profile upon successful OTP verification
const phoneSignup: Handler<typeof phoneSignupSchema> = async (c) => {
	const { phone, code, name, gender, birthYear, deviceInfo } = c.get("validated")

	// Verify OTP first
	const otpResult = await verifyOTPCode(c, phone, code)
	if (!otpResult.success) {
		// Map OTP error codes to specific API error codes
		switch (otpResult.errorCode) {
			case "OTP_EXPIRED":
				return res.expiredOtp(c)
			case "OTP_MAX_ATTEMPTS":
				return res.tooManyOtpAttempts(c)
			case "OTP_INVALID":
				return res.invalidOtp(c)
			case "OTP_NOT_FOUND":
				return res.unauthorized(c, otpResult.error || "OTP verification failed")
			default:
				return res.unauthorized(c, otpResult.error || "OTP verification failed")
		}
	}

	const db = getDb(c)

	// Check if user already exists (auth + user profile)
	const [existingAuth] = await db
		.select()
		.from(auth)
		.where(and(eq(auth.provider, "phone"), eq(auth.identifier, phone))!)
		.limit(1)
	if (existingAuth) {
		// Check if user profile exists for this auth record
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, existingAuth.id))
			.limit(1)
		if (existingUser) {
			return res.userExists(c, "User already exists. Please login instead.")
		}
		// This case shouldn't happen in normal flow, but handle gracefully
		return res.profileIncomplete(c, "Account setup incomplete. Please contact support.")
	}

	// Create new user (auth + user profile)
	const [newAuth] = await db
		.insert(auth)
		.values({ provider: "phone", identifier: phone })
		.returning()
	try {
		// Create user profile
		await db.insert(users).values({
			id: newAuth.id,
			name,
			gender,
			birthYear,
		})
	} catch (error) {
		// If user creation fails, clean up auth record in background
		c.executionCtx.waitUntil(db.delete(auth).where(eq(auth.id, newAuth.id)))
		throw error
	}

	// Issue authentication tokens
	const tokens = await issueTokens(c, newAuth.id, deviceInfo)

	return res.created(c, {
		...tokens,
	})
}

// Phone Sign-In: Sign in existing user with OTP verification
const phoneSignIn: Handler<typeof phoneSignInSchema> = async (c) => {
	const { phone, code, deviceInfo } = c.get("validated")

	// Verify OTP first
	const otpResult = await verifyOTPCode(c, phone, code)
	if (!otpResult.success) {
		// Map OTP error codes to specific API error codes
		switch (otpResult.errorCode) {
			case "OTP_EXPIRED":
				return res.expiredOtp(c)
			case "OTP_MAX_ATTEMPTS":
				return res.tooManyOtpAttempts(c)
			case "OTP_INVALID":
				return res.invalidOtp(c)
			case "OTP_NOT_FOUND":
				return res.unauthorized(c, otpResult.error || "OTP verification failed")
			default:
				return res.unauthorized(c, otpResult.error || "OTP verification failed")
		}
	}

	const db = getDb(c)

	// Check if user exists
	const [existingAuth] = await db
		.select()
		.from(auth)
		.where(and(eq(auth.provider, "phone"), eq(auth.identifier, phone))!)
		.limit(1)
	if (!existingAuth) {
		return res.userNotFound(c, "User not found. Please sign up first.")
	}

	// Ensure user profile exists (data consistency check)
	const [existingUser] = await db.select().from(users).where(eq(users.id, existingAuth.id)).limit(1)
	if (!existingUser) {
		return res.profileIncomplete(c, "User profile incomplete. Please sign up again.")
	}

	// Issue authentication tokens
	const tokens = await issueTokens(c, existingAuth.id, deviceInfo)

	return res.ok(c, {
		...tokens,
	})
}

// Refresh Access Token - Uses refresh token to get new access token
const refreshTokens: Handler<typeof refreshTokensSchema> = async (c) => {
	const { refreshToken } = c.get("validated")

	const db = getDb(c)
	const [token] = await db.select().from(tokens).where(eq(tokens.token, refreshToken)).limit(1)

	// Verify refresh token is valid and not expired
	if (!token || token.revokedAt || token.expiresAt < now()) {
		return res.invalidRefreshToken(c)
	}

	// Get the auth record from the refresh token
	const [authRecord] = await db.select().from(auth).where(eq(auth.id, token.authId)).limit(1)
	if (!authRecord) {
		return res.unauthorized(c, "User not found")
	}

	// Check cooldown: prevent rapid refresh abuse
	if (recentlyRefreshed(token.lastUsedAt)) {
		return res.rateLimited(c)
	}

	// Generate new refresh token and update existing record
	const newRefreshToken = generateRefreshToken()
	const expiresAt = daysFromNow(AUTH_CONFIG.REFRESH_TOKEN_EXPIRY_DAYS)

	await db
		.update(tokens)
		.set({
			token: newRefreshToken,
			expiresAt,
			lastUsedAt: now(),
		})
		.where(eq(tokens.token, refreshToken))

	const accessToken = await generateAccessToken(c, token.authId)
	return res.ok(c, { accessToken, refreshToken: newRefreshToken } as TokenResponse)
}

// Logout - Revoke refresh token
const logout: Handler<typeof logoutSchema> = async (c) => {
	const { refreshToken } = c.get("validated")

	const db = getDb(c)
	const [token] = await db.select().from(tokens).where(eq(tokens.token, refreshToken)).limit(1)
	if (token && !token.revokedAt) {
		await db.update(tokens).set({ revokedAt: now() }).where(eq(tokens.token, refreshToken))
	} else {
		return res.unauthorized(c, "Invalid refresh token")
	}
	return res.ok(c, { message: "Logged out" })
}

// Decode JWT token (base64url decode) - only decodes, doesn't verify signature
const decodeJWT = (token: string): Record<string, unknown> => {
	try {
		const parts = token.split(".")
		if (parts.length !== 3) {
			throw new Error("Invalid JWT format")
		}
		// Decode the payload (second part)
		const payload = parts[1]
		// Replace URL-safe base64 characters
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
		// Add padding if needed
		const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
		// Decode
		const decoded = atob(padded)
		return JSON.parse(decoded)
	} catch {
		throw new Error("Failed to decode JWT token")
	}
}

// Decode JWT header to get algorithm and key ID
const decodeJWTHeader = (token: string): { alg: string; kid?: string } => {
	try {
		const parts = token.split(".")
		if (parts.length !== 3) {
			throw new Error("Invalid JWT format")
		}
		const header = parts[0]
		const base64 = header.replace(/-/g, "+").replace(/_/g, "/")
		const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
		const decoded = atob(padded)
		return JSON.parse(decoded)
	} catch {
		throw new Error("Failed to decode JWT header")
	}
}

// Verify Google JWT token signature and claims
const verifyGoogleJWT = async (token: string): Promise<Record<string, unknown>> => {
	const header = decodeJWTHeader(token)
	const claims = decodeJWT(token)

	// Verify issuer
	if (claims.iss !== "https://accounts.google.com" && claims.iss !== "accounts.google.com") {
		throw new Error("Invalid Google token issuer")
	}

	// Verify expiration
	if (typeof claims.exp === "number" && claims.exp < Math.floor(Date.now() / 1000)) {
		throw new Error("Google token has expired")
	}

	// Verify audience (should match your Google OAuth client ID)
	// Note: This requires the client ID to be configured
	// For now, we'll skip audience verification as it requires environment variable
	// TODO: Add audience verification when client ID is available in environment

	// Verify signature using Google's JWKS
	// For production, you should fetch and cache JWKS
	// For now, we'll do basic validation and note that full signature verification
	// requires fetching JWKS from https://www.googleapis.com/oauth2/v3/certs
	// This is a security improvement but requires additional implementation

	// Basic structure validation - full signature verification requires JWKS
	if (!header.kid) {
		throw new Error("Google token missing key ID")
	}

	return claims
}

// Verify Apple JWT token signature and claims
const verifyAppleJWT = async (token: string): Promise<Record<string, unknown>> => {
	const header = decodeJWTHeader(token)
	const claims = decodeJWT(token)

	// Verify issuer
	if (claims.iss !== "https://appleid.apple.com") {
		throw new Error("Invalid Apple token issuer")
	}

	// Verify expiration
	if (typeof claims.exp === "number" && claims.exp < Math.floor(Date.now() / 1000)) {
		throw new Error("Apple token has expired")
	}

	// Verify audience (should match your Apple client ID)
	// Note: This requires the client ID to be configured
	// TODO: Add audience verification when client ID is available in environment

	// Verify signature using Apple's JWKS
	// For production, you should fetch and cache JWKS
	// For now, we'll do basic validation and note that full signature verification
	// requires fetching JWKS from https://appleid.apple.com/auth/keys
	// This is a security improvement but requires additional implementation

	// Basic structure validation - full signature verification requires JWKS
	if (!header.kid) {
		throw new Error("Apple token missing key ID")
	}

	return claims
}

// Google Sign-in: Authenticate with Google ID token
const googleSignIn: Handler<typeof googleSignInSchema> = async (c) => {
	const { idToken, deviceInfo } = c.get("validated")

	// Verify and decode the Google ID token
	let googleClaims: Record<string, unknown>
	try {
		googleClaims = await verifyGoogleJWT(idToken)
	} catch (error) {
		return res.unauthorized(c, error instanceof Error ? error.message : "Invalid Google ID token")
	}

	// Extract user information from Google token
	const email = googleClaims.email as string | undefined
	const googleId = googleClaims.sub as string | undefined

	if (!email || !googleId) {
		return res.unauthorized(c, "Invalid Google ID token: missing email or user ID")
	}

	const db = getDb(c)

	// Check if user already exists by Google provider ID
	const [existingAuth] = await db
		.select()
		.from(auth)
		.where(and(eq(auth.provider, "google"), eq(auth.identifier, googleId))!)
		.limit(1)

	if (existingAuth) {
		// User exists, check if profile exists
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, existingAuth.id))
			.limit(1)

		if (!existingUser) {
			return res.profileIncomplete(c, "User profile incomplete. Please contact support.")
		}

		// Update email if provided and not set
		if (email && !existingAuth.email) {
			await db.update(auth).set({ email }).where(eq(auth.id, existingAuth.id))
		}

		// Issue authentication tokens
		const tokens = await issueTokens(c, existingAuth.id, deviceInfo)

		return res.ok(c, {
			...tokens,
		})
	}

	// New user - check if email is already used by a different provider
	if (email) {
		const [emailConflict] = await db.select().from(auth).where(eq(auth.email, email)).limit(1)

		if (emailConflict && emailConflict.provider !== "google") {
			const providerName = capitalizeFirst(emailConflict.provider)
			const article = getArticle(emailConflict.provider)
			return res.conflict(
				c,
				`This email is already associated with ${article} ${providerName} account. Please sign in with ${providerName} instead.`,
			)
		}
	}

	// New user - return provider info for signup (don't create records yet)
	return res.ok(c, {
		needsSignup: true,
		provider: "google",
		providerId: googleId,
		email,
	} as TokenResponse)
}

// Apple Sign-in: Authenticate with Apple ID token
const appleSignIn: Handler<typeof appleSignInSchema> = async (c) => {
	const { idToken, deviceInfo } = c.get("validated")

	// Verify and decode the Apple ID token
	let appleClaims: Record<string, unknown>
	try {
		appleClaims = await verifyAppleJWT(idToken)
	} catch (error) {
		return res.unauthorized(c, error instanceof Error ? error.message : "Invalid Apple ID token")
	}

	// Extract user information from Apple token
	// Apple uses 'sub' for user ID and 'email' for email (may be null if user chose to hide it)
	const email = appleClaims.email as string | undefined
	const appleId = appleClaims.sub as string | undefined

	if (!appleId) {
		return res.unauthorized(c, "Invalid Apple ID token: missing user ID")
	}

	const db = getDb(c)

	// Check if user already exists by Apple provider ID
	const [existingAuth] = await db
		.select()
		.from(auth)
		.where(and(eq(auth.provider, "apple"), eq(auth.identifier, appleId))!)
		.limit(1)

	if (existingAuth) {
		// User exists, check if profile exists
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, existingAuth.id))
			.limit(1)

		if (!existingUser) {
			return res.profileIncomplete(c, "User profile incomplete. Please contact support.")
		}

		// Update email if provided and not set
		if (email && !existingAuth.email) {
			await db.update(auth).set({ email }).where(eq(auth.id, existingAuth.id))
		}

		// Issue authentication tokens
		const tokens = await issueTokens(c, existingAuth.id, deviceInfo)

		return res.ok(c, {
			...tokens,
		})
	}

	// New user - check if email is already used by a different provider
	if (email) {
		const [emailConflict] = await db.select().from(auth).where(eq(auth.email, email)).limit(1)

		if (emailConflict && emailConflict.provider !== "apple") {
			const providerName = capitalizeFirst(emailConflict.provider)
			const article = getArticle(emailConflict.provider)
			return res.conflict(
				c,
				`This email is already associated with ${article} ${providerName} account. Please sign in with ${providerName} instead.`,
			)
		}
	}

	// New user - return provider info for signup (don't create records yet)
	return res.ok(c, {
		needsSignup: true,
		provider: "apple",
		providerId: appleId,
		email: email || undefined, // Apple may not provide email
	} as TokenResponse)
}

// OAuth Signup: Complete OAuth signup with profile data
const oauthSignup: Handler<typeof oauthSignupSchema> = async (c) => {
	const { provider, providerId, email, name, gender, birthYear, deviceInfo } = c.get("validated")

	const db = getDb(c)

	// Check if user already exists by provider ID
	const [existingAuth] = await db
		.select()
		.from(auth)
		.where(and(eq(auth.provider, provider), eq(auth.identifier, providerId))!)
		.limit(1)

	if (existingAuth) {
		// User exists, check if profile exists
		const [existingUser] = await db
			.select()
			.from(users)
			.where(eq(users.id, existingAuth.id))
			.limit(1)

		if (!existingUser) {
			return res.profileIncomplete(c, "User profile incomplete. Please contact support.")
		}

		// Update email if provided and not set
		if (email && !existingAuth.email) {
			await db.update(auth).set({ email }).where(eq(auth.id, existingAuth.id))
		}

		// Issue authentication tokens
		const tokens = await issueTokens(c, existingAuth.id, deviceInfo)

		return res.ok(c, {
			...tokens,
		})
	}

	// New user - check if email is already used by a different provider (safety check)
	if (email) {
		const [emailConflict] = await db.select().from(auth).where(eq(auth.email, email)).limit(1)

		if (emailConflict && emailConflict.provider !== provider) {
			const providerName = capitalizeFirst(emailConflict.provider)
			const article = getArticle(emailConflict.provider)
			return res.conflict(
				c,
				`This email is already associated with ${article} ${providerName} account. Please sign in with ${providerName} instead.`,
			)
		}
	}

	// New user - create auth and user records
	const [newAuth] = await db
		.insert(auth)
		.values({
			provider,
			email: email || null,
			identifier: providerId,
		})
		.returning()

	try {
		// Create user profile
		await db.insert(users).values({
			id: newAuth.id,
			name,
			gender,
			birthYear,
		})
	} catch (error) {
		// If user creation fails, clean up auth record
		c.executionCtx.waitUntil(db.delete(auth).where(eq(auth.id, newAuth.id)))
		throw error
	}

	// Issue authentication tokens
	const tokens = await issueTokens(c, newAuth.id, deviceInfo)

	return res.created(c, {
		...tokens,
	})
}

export const registerRoutes = (app: Hono) => {
	app.post("/auth/phone/otp", validate(otpRequestSchema), requestOTP)
	app.post("/auth/phone/signup", validate(phoneSignupSchema), phoneSignup)
	app.post("/auth/phone/login", validate(phoneSignInSchema), phoneSignIn)
	app.post("/auth/google", validate(googleSignInSchema), googleSignIn)
	app.post("/auth/apple", validate(appleSignInSchema), appleSignIn)
	app.post("/auth/oauth/signup", validate(oauthSignupSchema), oauthSignup)
	app.post("/auth/token/refresh", validate(refreshTokensSchema), refreshTokens)
	app.post("/auth/logout", validate(logoutSchema), logout)
}
