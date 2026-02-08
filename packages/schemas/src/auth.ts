import { z } from "zod"

import {
	appleIdToken,
	birthYear,
	deviceInfo,
	gender,
	googleIdToken,
	otp,
	otpRequestPurpose,
	phone,
	refreshToken,
	userName,
} from "./primitives"

// OTP Request Validation Schema
export const otpRequestSchema = z.object({
	phone: phone,
	purpose: otpRequestPurpose,
})

// Phone Signup Validation Schema
export const phoneSignupSchema = z.object({
	phone: phone,
	code: otp,
	name: userName,
	gender: gender,
	birthYear: birthYear,
	deviceInfo: deviceInfo.optional(), // optional for flexibility (although required by the database)
})

// Phone Sign-In Validation Schema
export const phoneSignInSchema = z.object({
	phone: phone,
	code: otp,
	deviceInfo: deviceInfo.optional(), // optional for flexibility (although required by the database)
})

// Google Sign-in Validation Schema
export const googleSignInSchema = z.object({
	idToken: googleIdToken,
	deviceInfo: deviceInfo.optional(), // optional for flexibility (although required by the database)
})

// Apple Sign-in Validation Schema
export const appleSignInSchema = z.object({
	idToken: appleIdToken,
	deviceInfo: deviceInfo.optional(), // optional for flexibility (although required by the database)
})

// Refresh Tokens Validation Schema
export const refreshTokensSchema = z.object({
	refreshToken: refreshToken,
})

// OAuth Signup Validation Schema (for completing OAuth signup)
export const oauthSignupSchema = z.object({
	provider: z.enum(["google", "apple"]),
	providerId: z.string().min(1, "Provider ID is required"),
	email: z.string().email().optional().nullable(),
	name: userName,
	gender: gender,
	birthYear: birthYear,
	deviceInfo: deviceInfo.optional(), // optional for flexibility (although required by the database)
})

// Logout Validation Schema
export const logoutSchema = z.object({
	refreshToken: refreshToken,
})

// Export types for use in other files
export type OtpRequest = z.infer<typeof otpRequestSchema>
export type PhoneSignupRequest = z.infer<typeof phoneSignupSchema>
export type PhoneSignInRequest = z.infer<typeof phoneSignInSchema>
export type GoogleSignInRequest = z.infer<typeof googleSignInSchema>
export type AppleSignInRequest = z.infer<typeof appleSignInSchema>
export type OAuthSignupRequest = z.infer<typeof oauthSignupSchema>
export type RefreshTokensRequest = z.infer<typeof refreshTokensSchema>
export type LogoutRequest = z.infer<typeof logoutSchema>
