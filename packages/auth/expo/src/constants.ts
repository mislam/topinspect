/**
 * Centralized navigation routes for authentication flows
 * All hooks use these constants to ensure consistency
 */
export const AUTH_ROUTES = {
	LOGIN: "/(auth)/login",
	SIGNUP: "/(auth)/signup",
	OTP: "/(auth)/otp",
	HOME: "/",
} as const

/**
 * Timing constants for UI interactions
 */
export const TIMING = {
	AUTO_FOCUS_DELAY: 500, // Delay before auto-focusing input (ms)
	OTP_RESEND_COOLDOWN: 60, // Cooldown period for OTP resend (seconds)
	PICKER_OPEN_DELAY: 100, // Delay before opening picker (ms)
} as const
