import { z } from "zod"

// Common validation schemas that can be reused across different domains

export const phone = z
	.string()
	.nonempty("Phone number is required")
	.transform((val) => val.trim().replace(/\D/g, ""))
	.refine((val) => /^[2-9]\d{2}[2-9](?!11)\d{2}\d{4}$/.test(val), "Invalid phone number")

export const otp = z
	.string()
	.nonempty("OTP is required")
	.transform((val) => val.trim())
	.refine((val) => /^\d{6}$/.test(val), "OTP must be 6 digits")

export const userName = z
	.string()
	.nonempty("Name is required")
	.transform((val) => val.trim())
	.refine((val) => val.length >= 2, "Name is too short")
	.refine((val) => val.length <= 50, "Name is too long (max 50 characters)")
	.refine((val) => /^[\p{L}\p{M}\s]+$/u.test(val), "Name contains invalid characters")

export const gender = z.enum(["male", "female"], "Gender is required")

export const birthYear = z
	.number("Birth year is required")
	.int("Birth year must be a whole number")
	.min(1900, "Birth year too far in the past")
	.refine((year) => year <= new Date().getFullYear() - 13, "Must be at least 13 years old")

export const deviceInfo = z.object({
	os: z.enum(["ios", "android", "windows", "macos", "web"]),
	osVersion: z.string(),
	model: z.string(),
	brand: z.string(),
	deviceYearClass: z.number().nullable(), // Optional due to possible null
	appVersion: z.string(),
	buildNumber: z.string(),
})

export const refreshToken = z
	.string()
	.nonempty("Refresh token is required")
	.transform((val) => val.trim())
	.refine((val) => val.length === 24, "Invalid refresh token length")
	.refine((val) => /^[0-9a-z]{24}$/.test(val), "Invalid refresh token format")

export const otpRequestPurpose = z.enum(["login", "signup"])

// Google sign-in primitives
export const googleIdToken = z
	.string()
	.nonempty("Google ID token is required")
	.transform((val) => val.trim())
	.refine((val) => val.length >= 100, "Invalid Google ID token format")

// Apple sign-in primitives
export const appleIdToken = z
	.string()
	.nonempty("Apple ID token is required")
	.transform((val) => val.trim())
	.refine((val) => val.length >= 100, "Invalid Apple ID token format")

export const imageUrl = z.url("Invalid image URL").max(500, "Image URL is too long")

// Export types for use in other files
export type DeviceInfo = z.infer<typeof deviceInfo>
export type Gender = z.infer<typeof gender>
export type OtpRequestPurpose = z.infer<typeof otpRequestPurpose>
