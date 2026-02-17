import { useEffect, useState } from "react"

import { logger } from "@prism/utils/expo"
import { GoogleSignin } from "@react-native-google-signin/google-signin"

import { signInWithGoogle } from "../service"
import { useAuthStore } from "../store"

import { navigateToHome, navigateToOAuthSignup } from "./utils"

export type GoogleSignInError = {
	type: "configuration" | "oauth" | "api"
	code?: string | number
	message: string
	title?: string
} | null

export function useGoogleSignIn() {
	const { error: storeError } = useAuthStore()
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<GoogleSignInError>(null)

	const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
	const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID

	// Configure Google Sign-In
	useEffect(() => {
		if (!iosClientId || !webClientId) {
			logger.warn("Google Sign-In client IDs are not configured")
			return
		}
		GoogleSignin.configure({
			iosClientId,
			webClientId,
		})
	}, [iosClientId, webClientId])

	const handleGoogleSignIn = async (): Promise<void> => {
		if (!iosClientId || !webClientId) {
			setError({
				type: "configuration",
				title: "Configuration Error",
				message:
					"Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your environment variables.",
			})
			return
		}

		setIsLoading(true)
		setError(null)
		try {
			// Check if Google Play Services are available (Android only)
			await GoogleSignin.hasPlayServices()

			// Sign in and get user info
			await GoogleSignin.signIn()

			// Get the ID token from the current user
			const tokens = await GoogleSignin.getTokens()

			if (!tokens?.idToken) {
				throw new Error("No ID token received from Google")
			}

			// Sign in with the ID token
			const result = await signInWithGoogle(tokens.idToken)

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
			// Handle specific error codes (both string and numeric)
			const err = error as { code?: string | number; error?: string; message?: string }
			const errorCode = err.code === "10" || err.code === 10 ? "DEVELOPER_ERROR" : err.code

			// User cancellation - silent, no error
			if (errorCode === "getTokens" && err.message?.includes("requires a user to be signed in")) {
				logger.debug("The user canceled the authorization attempt.")
				setIsLoading(false)
				return
			}

			// Handle OAuth SDK errors
			if (errorCode === "IN_PROGRESS") {
				setError({
					type: "oauth",
					code: errorCode,
					message: "Sign-in in progress. Please wait for the current sign-in to complete.",
				})
				setIsLoading(false)
				return
			}

			if (errorCode === "PLAY_SERVICES_NOT_AVAILABLE") {
				setError({
					type: "oauth",
					code: errorCode,
					message: "Google Play Services is not available. Please install it.",
				})
				setIsLoading(false)
				return
			}

			if (errorCode === "DEVELOPER_ERROR") {
				// Log technical details for debugging (not shown to user)
				logger.debug("Google Sign-In DEVELOPER_ERROR - Configuration issue", {
					error,
					iosClientIdSet: !!iosClientId,
					webClientIdSet: !!webClientId,
					note: "Create Android OAuth client with SHA-1 fingerprint (even though code uses Web client ID). Package must match app.json/android.package.",
					troubleshootingUrl: "https://react-native-google-signin.github.io/docs/troubleshooting",
				})

				setError({
					type: "oauth",
					code: errorCode,
					title: "Sign-in Error",
					message:
						"Unable to sign in with Google. Please try again later or contact support if the issue persists.",
				})
				setIsLoading(false)
				return
			}

			// API errors are handled by store, but we can surface them here too
			if (errorCode === "CONFLICT") {
				setError({
					type: "api",
					code: errorCode,
					title: "Email already in use",
					message:
						err.error || err.message || "This email is already associated with another account.",
				})
				setIsLoading(false)
				return
			}

			// Fallback error
			setError({
				type: "oauth",
				code: errorCode,
				message:
					`Failed to sign in with Google.\nCode: ${String(errorCode)}` +
					(err.message ? `\nMessage: ${err.message}` : ""),
			})
		} finally {
			setIsLoading(false)
		}
	}

	return {
		isLoading,
		error:
			error ||
			(storeError ? ({ type: "api" as const, message: storeError } as GoogleSignInError) : null),
		handleGoogleSignIn,
	}
}
