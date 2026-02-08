import { useEffect, useRef } from "react"

import { useAuthStore } from "@the/auth/expo"
import { Alert, Toast } from "@the/ui/expo"
import { registerDevMenu } from "@the/utils/expo"
import { KeyboardProvider } from "react-native-keyboard-controller"

import { Stack, usePathname } from "expo-router"
import * as SplashScreen from "expo-splash-screen"

import "@/config/app.css"
import "@/config/svg"

// Configure splash screen animation
SplashScreen.setOptions({
	duration: 500,
	fade: true,
})

// Prevent the splash screen from auto-hiding while we fetch resources
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
	const { isAuthenticated, isAuthLoading } = useAuthStore()
	const pathname = usePathname()
	const previousPathname = useRef(pathname)

	// Register custom dev menu items
	registerDevMenu(useAuthStore)

	// Auto-dismiss toasts on route changes (except manual ones)
	useEffect(() => {
		if (previousPathname.current !== pathname) {
			Alert.hide()
		}
		previousPathname.current = pathname
	}, [pathname])

	// Hide the splash screen once authentication state is loaded
	useEffect(() => {
		if (!isAuthLoading) {
			SplashScreen.hideAsync()
		}
	}, [isAuthLoading])

	// Don't render anything while loading auth state - splash screen will show
	if (isAuthLoading) {
		return null
	}

	return (
		<KeyboardProvider>
			<Stack screenOptions={{ headerShown: false }}>
				{/* Auth routes - only accessible when NOT authenticated */}
				<Stack.Protected guard={!isAuthenticated}>
					<Stack.Screen name="(auth)" />
				</Stack.Protected>

				{/* App routes - only accessible when authenticated */}
				<Stack.Protected guard={isAuthenticated}>
					<Stack.Screen name="(tabs)" />
				</Stack.Protected>
			</Stack>
			<Toast />
		</KeyboardProvider>
	)
}
