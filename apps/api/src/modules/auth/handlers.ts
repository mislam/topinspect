import {
	logoutSchema,
	oauthSignInSchema,
	oauthSignupSchema,
	otpRequestSchema,
	phoneSignInSchema,
	phoneSignupSchema,
	refreshTokensSchema,
} from "@prism/schemas"
import { capitalizeFirst, getArticle } from "@prism/utils/shared"
import { and, eq } from "drizzle-orm"
import { sign } from "hono/jwt"
import { createRemoteJWKSet, decodeJwt, jwtVerify } from "jose"

import { AUTH_CONFIG } from "./config"

import type { OtpVerificationResult } from "./types"
import type { Handler } from "@/utils/validation"
import type { DeviceInfo } from "@prism/schemas"
import type { OtpResponse, TokenResponse } from "@prism/types"
import type { Context, Hono } from "hono"

import { getDb } from "@/adapters/database"
import { sendEmail } from "@/adapters/email"
import { sendOTP } from "@/adapters/sms"
import { auth, otps, tokens, users } from "@/db/schema"
import { WelcomeEmail } from "@/emails"
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

// Map OTP verification errors to API responses
const handleOtpError = (
	c: Context,
	otpResult: OtpVerificationResult & { success: false },
): ReturnType<typeof res.expiredOtp> => {
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
		return handleOtpError(c, otpResult)
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
	} as TokenResponse)
}

// Phone Sign-In: Sign in existing user with OTP verification
const phoneSignIn: Handler<typeof phoneSignInSchema> = async (c) => {
	const { phone, code, deviceInfo } = c.get("validated")

	// Verify OTP first
	const otpResult = await verifyOTPCode(c, phone, code)
	if (!otpResult.success) {
		return handleOtpError(c, otpResult)
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
	} as TokenResponse)
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

// OAuth JWT verification: fetches JWKS from provider, verifies signature + issuer + expiry
// JWKS is cached by jose; keys are resolved by kid from JWT header
type OAuthVerifierConfig = {
	jwks: ReturnType<typeof createRemoteJWKSet>
	issuer: string | readonly string[]
	providerName: string
}

const OAUTH_VERIFIER_CONFIGS: Record<"google" | "apple", OAuthVerifierConfig> = {
	google: {
		jwks: createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs")),
		issuer: ["https://accounts.google.com", "accounts.google.com"],
		providerName: "Google",
	},
	apple: {
		jwks: createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys")),
		issuer: "https://appleid.apple.com",
		providerName: "Apple",
	},
}

const verifyOAuthJWT = async (
	token: string,
	config: OAuthVerifierConfig,
	env: string,
): Promise<Record<string, unknown>> => {
	// Local dev: Apple JWKS fetch returns 403 from wrangler dev. Decode without verification.
	if (env === "development" && config.providerName === "Apple") {
		const payload = decodeJwt(token) as Record<string, unknown>
		const issuer = Array.isArray(config.issuer) ? config.issuer : [config.issuer]
		if (!issuer.includes(payload.iss as string)) {
			throw new Error("Invalid issuer")
		}
		if (
			payload.exp &&
			typeof payload.exp === "number" &&
			payload.exp < Math.floor(Date.now() / 1000)
		) {
			throw new Error("Token expired")
		}
		return payload
	}
	const { payload } = await jwtVerify(token, config.jwks, {
		issuer: config.issuer as string | string[],
	})
	return payload as Record<string, unknown>
}

// OAuth sign-in handler factory - shared logic for Google, Apple, etc.
type OAuthProvider = "google" | "apple"

const createOAuthSignInHandler = (provider: OAuthProvider): Handler<typeof oauthSignInSchema> =>
	async function oauthSignIn(c) {
		const { idToken, deviceInfo } = c.get("validated")
		const invalidTokenMessage = `Invalid ${capitalizeFirst(provider)} ID token`

		let claims: Record<string, unknown>
		try {
			claims = await verifyOAuthJWT(
				idToken,
				OAUTH_VERIFIER_CONFIGS[provider],
				getEnv(c).ENV ?? "production",
			)
		} catch (error) {
			return res.unauthorized(c, error instanceof Error ? error.message : invalidTokenMessage)
		}

		const email = claims.email as string | undefined
		const providerId = claims.sub as string | undefined

		if (!email || !providerId) {
			return res.unauthorized(c, invalidTokenMessage)
		}

		const db = getDb(c)

		const [existingAuth] = await db
			.select()
			.from(auth)
			.where(and(eq(auth.provider, provider), eq(auth.identifier, providerId))!)
			.limit(1)

		if (existingAuth) {
			const [existingUser] = await db
				.select()
				.from(users)
				.where(eq(users.id, existingAuth.id))
				.limit(1)

			if (!existingUser) {
				return res.profileIncomplete(c, "User profile incomplete. Please contact support.")
			}

			if (!existingAuth.email) {
				await db.update(auth).set({ email }).where(eq(auth.id, existingAuth.id))
			}

			const tokens = await issueTokens(c, existingAuth.id, deviceInfo)
			return res.ok(c, { ...tokens } as TokenResponse)
		}

		const [emailConflict] = await db.select().from(auth).where(eq(auth.email, email)).limit(1)

		if (emailConflict && emailConflict.provider !== provider) {
			const providerName = capitalizeFirst(emailConflict.provider)
			const article = getArticle(emailConflict.provider)
			return res.conflict(
				c,
				`This email is already associated with ${article} ${providerName} account. Please sign in with ${providerName} instead.`,
			)
		}

		return res.ok(c, {
			needsSignup: true,
			provider,
			providerId,
			email,
		} as TokenResponse)
	}

const googleSignIn = createOAuthSignInHandler("google")
const appleSignIn = createOAuthSignInHandler("apple")

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

		// This should never happen, but we'll handle it gracefully
		if (!existingUser) {
			return res.profileIncomplete(c, "User profile incomplete. Please contact support.")
		}

		// Update email if provided and not set
		if (!existingAuth.email) {
			await db.update(auth).set({ email }).where(eq(auth.id, existingAuth.id))
		}

		// Issue authentication tokens
		const tokens = await issueTokens(c, existingAuth.id, deviceInfo)

		return res.ok(c, {
			...tokens,
		} as TokenResponse)
	}

	// New user - check if email is already used by a different provider (safety check)
	const [emailConflict] = await db.select().from(auth).where(eq(auth.email, email)).limit(1)

	if (emailConflict && emailConflict.provider !== provider) {
		const providerName = capitalizeFirst(emailConflict.provider)
		const article = getArticle(emailConflict.provider)
		return res.conflict(
			c,
			`This email is already associated with ${article} ${providerName} account. Please sign in with ${providerName} instead.`,
		)
	}

	// New user - create auth and user records
	const [newAuth] = await db
		.insert(auth)
		.values({
			provider,
			email,
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

	// Send welcome email
	c.executionCtx.waitUntil(
		sendEmail(c, {
			to: email,
			subject: `Welcome to ${getEnv(c).APP_NAME}`,
			template: WelcomeEmail({
				appName: getEnv(c).APP_NAME,
				username: name.split(" ")[0], // use first name for greeting
				dashboardUrl: `${getEnv(c).APP_URL}/dashboard`,
				supportUrl: `${getEnv(c).APP_URL}/support`,
			}),
		}),
	)

	return res.created(c, {
		...tokens,
	} as TokenResponse)
}

export const registerRoutes = (app: Hono) => {
	app.post("/auth/phone/otp", validate(otpRequestSchema), requestOTP)
	app.post("/auth/phone/signup", validate(phoneSignupSchema), phoneSignup)
	app.post("/auth/phone/login", validate(phoneSignInSchema), phoneSignIn)
	app.post("/auth/google", validate(oauthSignInSchema), googleSignIn)
	app.post("/auth/apple", validate(oauthSignInSchema), appleSignIn)
	app.post("/auth/oauth/signup", validate(oauthSignupSchema), oauthSignup)
	app.post("/auth/token/refresh", validate(refreshTokensSchema), refreshTokens)
	app.post("/auth/logout", validate(logoutSchema), logout)
}
