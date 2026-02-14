import { useEffect, useState } from "react"

import { logger } from "@the/utils/expo"

import { Platform } from "react-native"

import * as AppleAuthentication from "expo-apple-authentication"

import { signInWithApple } from "../service"
import { useAuthStore } from "../store"

import { navigateToHome, navigateToOAuthSignup } from "./utils"

export type AppleSignInError = {
	type: "api" | "oauth"
	code?: string
	message: string
	title?: string
} | null

export function useAppleSignIn() {
	const { error: storeError } = useAuthStore()
	const [isAvailable, setIsAvailable] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<AppleSignInError>(null)

	// Check if Apple Authentication is available
	useEffect(() => {
		const checkAvailability = async () => {
			const available = await AppleAuthentication.isAvailableAsync()
			setIsAvailable(available)
		}
		checkAvailability()
	}, [])

	const handleAppleSignIn = async (): Promise<void> => {
		setIsLoading(true)
		setError(null)
		try {
			// Request Apple authentication
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			})

			if (!credential.identityToken) {
				throw new Error("No identity token received from Apple")
			}

			// Sign in with the ID token
			const result = await signInWithApple(credential.identityToken)

			// Check if signup is needed
			if (result?.needsSignup && result.provider && result.providerId) {
				navigateToOAuthSignup(
					result.provider as "google" | "apple",
					result.providerId,
					result.email,
				)
				return
			}

			// Navigate to home
			navigateToHome()
		} catch (error: unknown) {
			const err = error as { code?: string; error?: string; message?: string }

			// User cancellation - silent, no error
			if (err.code === "ERR_REQUEST_CANCELED") {
				logger.debug("The user canceled the authorization attempt.")
				setIsLoading(false)
				return
			}

			// Handle email conflict error (from API)
			if (err.code === "CONFLICT") {
				setError({
					type: "api",
					code: err.code,
					title: "Email already in use",
					message:
						err.error || err.message || "This email is already associated with another account.",
				})
				setIsLoading(false)
				return
			}

			// Fallback error
			logger.debug(
				`Failed to sign in with Apple.\nCode: ${err.code || "UNKNOWN"}` +
					(err.message ? `\nMessage: ${err.message}` : ""),
			)
			setError({
				type: "oauth",
				code: err.code,
				message:
					"Failed to sign in with Apple. Please try again later or contact support if the issue persists.",
			})
		} finally {
			setIsLoading(false)
		}
	}

	return {
		isLoading,
		isAvailable: Platform.OS === "ios" && isAvailable,
		error:
			error ||
			(storeError ? ({ type: "api" as const, message: storeError } as AppleSignInError) : null),
		handleAppleSignIn,
	}
}
