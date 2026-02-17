import { colors, Svg } from "@prism/ui/expo"
import { PlatformPressable } from "@react-navigation/elements"

import { useColorScheme } from "react-native"

import { Tabs } from "expo-router"

export default function TabsLayout() {
	const isDark = useColorScheme() === "dark"

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarHideOnKeyboard: true,
				tabBarStyle: {
					backgroundColor: isDark ? colors.slate[900] : colors.white,
					borderTopColor: isDark ? colors.slate[700] : colors.slate[300],
					elevation: 0, // remove shadow on Android
					shadowOpacity: 0, // remove shadow on iOS
					paddingTop: 4,
				},
				tabBarButton: ({ ...props }) => <PlatformPressable {...props} pressColor="transparent" />, // Hides ripple on Android
				tabBarActiveTintColor: isDark ? colors.slate[200] : colors.slate[800],
				tabBarInactiveTintColor: isDark ? colors.slate[200] : colors.slate[800],
				tabBarIconStyle: {
					width: 24,
					height: 24,
					marginBottom: 2,
				},
				tabBarLabelStyle: {
					fontSize: 10,
					fontWeight: "600",
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarIcon: ({ focused, color, size }) =>
						focused ? (
							<Svg name="home" width={size} height={size} color={color} />
						) : (
							<Svg name="homeOutline" width={size} height={size} color={color} />
						),
				}}
			/>
			<Tabs.Screen
				name="orders"
				options={{
					title: "Orders",
					tabBarIcon: ({ focused, color, size }) =>
						focused ? (
							<Svg name="bag" width={size} height={size} color={color} />
						) : (
							<Svg name="bagOutline" width={size} height={size} color={color} />
						),
				}}
			/>
			<Tabs.Screen
				name="messages"
				options={{
					title: "Messages",
					tabBarIcon: ({ focused, color, size }) =>
						focused ? (
							<Svg name="chatbubbles" width={size} height={size} color={color} />
						) : (
							<Svg name="chatbubblesOutline" width={size} height={size} color={color} />
						),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarIcon: ({ focused, color, size }) =>
						focused ? (
							<Svg name="gear" width={size} height={size} color={color} />
						) : (
							<Svg name="gearOutline" width={size} height={size} color={color} />
						),
				}}
			/>
		</Tabs>
	)
}
