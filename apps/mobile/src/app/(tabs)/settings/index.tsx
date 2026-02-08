import { logOut } from "@the/auth/expo"
import { Button, Text } from "@the/ui/expo"

import { View } from "react-native"

export default function SettingsScreen() {
	const handleLogout = async () => {
		await logOut()
	}

	return (
		<View className="flex-1 items-center justify-center bg-white px-4 dark:bg-slate-900">
			<View className="mb-6 items-center">
				<Text className="mb-4 text-2xl font-bold text-gray-900">Settings</Text>
				<Text className="text-gray-600">Manage your app settings here</Text>
			</View>
			<Button variant="danger" onPress={handleLogout}>
				Log out
			</Button>
		</View>
	)
}
