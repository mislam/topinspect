import { useAuthStore } from "@the/auth/expo"
import { Button, Text } from "@the/ui/expo"

import { View } from "react-native"

import { router } from "expo-router"

export default function NotFoundScreen() {
	const { isAuthenticated } = useAuthStore()

	const navigateToAppropriateScreen = () => {
		const route = isAuthenticated ? "/(tabs)" : "/(auth)/login"
		router.replace(route)
	}

	const handleGoBack = () => {
		if (router.canGoBack()) {
			router.back()
		} else {
			// If no previous route, go to appropriate screen
			navigateToAppropriateScreen()
		}
	}

	return (
		<View className="flex-1 justify-center gap-8 bg-white px-4 dark:bg-slate-900">
			{/* Message */}
			<View>
				<Text className="mb-2 text-center text-3xl font-bold">Not Found</Text>
				<Text className="text-center">
					What you&apos;re looking for isn&apos;t here or has moved. Go back or explore the app to
					find what you need.
				</Text>
			</View>

			{/* Action Buttons */}
			<View className="gap-4">
				<Button onPress={navigateToAppropriateScreen}>Go to Home</Button>
				<Button variant="outline" onPress={handleGoBack}>
					Go Back
				</Button>
			</View>

			{/* Additional Help */}
			<View>
				<Text className="text-center">If you need help, please contact support.</Text>
			</View>
		</View>
	)
}
