import { Text } from "@the/ui/expo"

import { View } from "react-native"

export default function MessageScreen() {
	return (
		<View className="flex-1 items-center justify-center bg-white px-4 dark:bg-slate-900">
			<Text className="mb-4 text-2xl font-bold text-gray-900">Conversation</Text>
			<Text className="text-center text-gray-600">
				Individual conversation with customer will be here
			</Text>
		</View>
	)
}
