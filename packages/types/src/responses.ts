// API response interfaces

export interface ErrorResponse {
	error: string
	code: string
	details?: unknown
}

export const UNKNOWN_ERROR: ErrorResponse = {
	error: "An unexpected error occurred.",
	code: "UNKNOWN_ERROR",
}

export interface OtpResponse {
	userExists: boolean
}

export interface TokenResponse {
	accessToken: string
	refreshToken: string
	needsSignup?: boolean // true if user needs to complete signup
	provider?: "phone" | "google" | "apple" // OAuth provider type
	providerId?: string // OAuth provider user ID
	email?: string // OAuth provider email (may be null for Apple)
}
