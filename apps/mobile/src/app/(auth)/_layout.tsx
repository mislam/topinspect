import { useEffect } from "react"

import { useAuthStore } from "@the/auth/expo"

import { Stack } from "expo-router"

export default function AuthLayout() {
	const { clearError } = useAuthStore()

	// Clear any previous errors when auth layout mounts
	useEffect(() => {
		clearError()
	}, [clearError])

	// Note: Error display is handled by individual screens:
	// - Hooks that return error state (useOtpFlow, useGoogleSignIn, useAppleSignIn) display errors in their screens
	// - Hooks that don't return error state (usePhoneSignIn, useSignupFlow) display errors via useAuthStore in their screens

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="login" />
			<Stack.Screen name="signup" />
			<Stack.Screen name="otp" />
			<Stack.Screen name="demo" />
		</Stack>
	)
}
