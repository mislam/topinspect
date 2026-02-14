import { useEffect, useRef } from "react"

import { useAuthStore } from "@the/auth/expo"
import { Alert, colors, Toast } from "@the/ui/expo"
import { registerDevMenu } from "@the/utils/expo"
import { KeyboardProvider } from "react-native-keyboard-controller"

import { useColorScheme } from "react-native"

import { Stack, usePathname } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import * as SystemUI from "expo-system-ui"

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
	const isDark = useColorScheme() === "dark"

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

	// Root view background: dark on auth (login has dark bg image), follow system theme elsewhere
	useEffect(() => {
		if (isAuthLoading) return
		const color = !isAuthenticated || isDark ? colors.slate[900] : colors.white
		SystemUI.setBackgroundColorAsync(color)
	}, [isAuthLoading, isAuthenticated, isDark])

	// Don't render anything while loading auth state - splash screen will show
	if (isAuthLoading) {
		return null
	}

	return (
		<KeyboardProvider>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: {
						backgroundColor: !isAuthenticated || isDark ? colors.slate[900] : colors.white,
					},
				}}
			>
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
