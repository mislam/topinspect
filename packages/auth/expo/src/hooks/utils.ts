import { router } from "expo-router"

import { AUTH_ROUTES } from "../constants"

/**
 * Navigates to signup screen with OAuth provider information
 */
export function navigateToOAuthSignup(
	provider: "google" | "apple",
	providerId: string,
	email?: string,
): void {
	router.push({
		pathname: AUTH_ROUTES.SIGNUP,
		params: {
			provider,
			providerId,
			email: email || "",
		},
	})
}

/**
 * Navigates to OTP screen with phone and purpose
 */
export function navigateToOtp(phone: string, purpose: "login" | "signup"): void {
	router.push({
		pathname: AUTH_ROUTES.OTP,
		params: { phone, purpose },
	})
}

/**
 * Navigates to signup screen with phone number
 */
export function navigateToPhoneSignup(phone: string): void {
	router.push({
		pathname: AUTH_ROUTES.SIGNUP,
		params: { phone },
	})
}

/**
 * Navigates to home screen (after successful authentication)
 */
export function navigateToHome(): void {
	router.replace(AUTH_ROUTES.HOME)
}
