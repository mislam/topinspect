import { registerDevMenuItems } from "expo-dev-menu"

import { getDeviceInfo } from "./device"
import { logger } from "./logger"

/**
 * Register dev menu items for debugging.
 * This is only available in development mode.
 *
 * @param useAuthStore - The auth store hook from the consuming app
 */
export function registerDevMenu(useAuthStore: { getState: () => { clearAll: () => void } }) {
	if (__DEV__) {
		registerDevMenuItems([
			{
				name: "Get Device Info",
				callback: () => {
					const deviceInfo = getDeviceInfo()
					logger.debug("Device Info " + JSON.stringify(deviceInfo, null, 2))
				},
			},
			{
				name: "Log Auth Store",
				callback: () => {
					const authStore = useAuthStore.getState()
					logger.debug("Auth Store " + JSON.stringify(authStore, null, 2))
				},
			},
			{
				name: "Clear Auth Storage",
				callback: () => {
					useAuthStore.getState().clearAll()
				},
			},
		])
	}
}
