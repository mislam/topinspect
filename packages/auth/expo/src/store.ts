import { logger, secureStorage } from "@prism/utils/expo"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { type AuthStore } from "./types"

// Zustand store for authentication state
export const useAuthStore = create<AuthStore>()(
	persist(
		(set) => ({
			// Core authentication state (persists)
			accessToken: null,
			refreshToken: null,
			isAuthenticated: false,
			isAuthLoading: true, // auth loading state, different from isLoading

			// UI state (doesn't persist)
			isLoading: false, // loading state for UI, different from isAuthLoading
			error: null,

			// Clear error
			clearError: () => {
				set({ error: null })
			},

			// Clear UI state
			clearUI: async () => {
				set({
					isLoading: false,
					error: null,
				})
			},

			// Clear all (except isAuthLoading)
			clearAll: async () => {
				set({
					accessToken: null,
					refreshToken: null,
					isAuthenticated: false,
					isLoading: false,
					error: null,
				})
				await secureStorage.removeItem("auth")
			},
		}),
		{
			name: "auth",
			storage: createJSONStorage(() => secureStorage),
			// Only persist core auth state, not UI state
			partialize: (state) => ({
				accessToken: state.accessToken,
				refreshToken: state.refreshToken,
				isAuthenticated: state.isAuthenticated,
			}),
			onRehydrateStorage: () => (state, error) => {
				if (error) {
					logger.debug("Error rehydrating auth state", { error })
				}
				if (state) {
					// Set auth loading to false once storage is rehydrated
					state.isAuthLoading = false
				}
			},
		},
	),
)
