import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store"

import { logger } from "./logger"

/**
 * Zustand storage adapter for expo-secure-store.
 * Provides secure storage for Zustand state persistence.
 */
export const secureStorage = {
	getItem: async (name: string): Promise<string | null> => {
		try {
			return await getItemAsync(name)
		} catch (error) {
			logger.warn(`Failed to get item "${name}" from secure storage:`, { error })
			return null
		}
	},
	setItem: async (name: string, value: string): Promise<void> => {
		try {
			await setItemAsync(name, value)
		} catch (error) {
			logger.warn(`Failed to set item "${name}" in secure storage:`, { error })
		}
	},
	removeItem: async (name: string): Promise<void> => {
		try {
			await deleteItemAsync(name)
		} catch (error) {
			logger.warn(`Failed to remove item "${name}" from secure storage:`, { error })
		}
	},
}
