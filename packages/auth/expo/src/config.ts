/**
 * Authentication configuration interface
 * Apps should provide this configuration when using auth screens
 */
export interface AuthConfig {
	phone: boolean
	google: boolean
	apple: boolean
}

/**
 * Parameters for OTP screen
 */
export interface OtpScreenParams {
	phone: string
	purpose: "login" | "signup"
	name?: string
	gender?: string
	birthYear?: string
}

/**
 * Parameters for Signup screen
 */
export interface SignupScreenParams {
	phone?: string
	provider?: "google" | "apple"
	providerId?: string
	email?: string
}
