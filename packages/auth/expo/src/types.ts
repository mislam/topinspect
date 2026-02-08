// Core authentication state (persists)
interface AuthState {
	accessToken: string | null
	refreshToken: string | null
	isAuthenticated: boolean
	isAuthLoading: boolean // Loading auth state from secure storage
}

// UI state (doesn't persist)
interface UIState {
	isLoading: boolean
	error: string | null
}

// Auth actions
interface AuthActions {
	clearError: () => void
	clearUI: () => void
	clearAll: () => void
}

// Auth store consists of core auth state, UI state, and actions
export type AuthStore = AuthState & UIState & AuthActions
