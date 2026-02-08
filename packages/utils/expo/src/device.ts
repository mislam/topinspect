import { Platform } from "react-native"

import Constants from "expo-constants"
import * as Device from "expo-device"

export function getDeviceInfo() {
	return {
		os: Platform.OS,
		osVersion: Platform.Version.toString(), // e.g., '17.5' for iOS or '14' for Android
		model: Device.modelName || Device.modelId || "unknown", // e.g., 'iPhone 14' or 'Pixel 8'
		brand: Device.brand || "unknown", // e.g., 'Apple' or 'Google'
		deviceYearClass: Device.deviceYearClass || null, // Approximate year of device release
		appVersion: Constants.expoConfig?.version || "unknown", // App version from app.json
		buildNumber:
			Platform.OS === "ios"
				? Constants.expoConfig?.ios?.buildNumber || "unknown"
				: Constants.expoConfig?.android?.versionCode?.toString() || "unknown", // Merged build identifier
	}
}
