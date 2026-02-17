import { Text } from "@prism/ui/expo"

import { View } from "react-native"

export default function OrderDetailsScreen() {
	return (
		<View className="flex-1 items-center justify-center bg-white px-4 dark:bg-slate-900">
			<Text className="mb-4 text-2xl font-bold text-gray-900">Order Details</Text>
			<Text className="text-center text-gray-600">
				Order details and status management will be here
			</Text>
		</View>
	)
}
