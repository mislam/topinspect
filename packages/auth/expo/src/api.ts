import { type LogoutRequest, type RefreshTokensRequest } from "@the/schemas"
import { type ErrorResponse, type JwtPayload, type TokenResponse, UNKNOWN_ERROR } from "@the/types"
import { logger } from "@the/utils/expo"
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"
import { jwtDecode } from "jwt-decode"

import { useAuthStore } from "./store"
import { setErrorState } from "./util"

// Singleton promise for token refresh to prevent concurrent refreshes
let refreshPromise: Promise<void> | null = null

const err = (errorCode: string): ErrorResponse => {
	const errorMessage = {
		NETWORK_ERROR: "Network error. Please check your connection.",
		TIMEOUT_ERROR: "Request timed out. Please try again.",
		INVALID_RESPONSE: UNKNOWN_ERROR.error, // Sanitize error message for sensitive information
		UNKNOWN_ERROR: UNKNOWN_ERROR.error,
	}[errorCode]

	if (!errorMessage) return UNKNOWN_ERROR

	return {
		error: errorMessage,
		code: errorCode,
	}
}

const handleError = async (error: AxiosError): Promise<ErrorResponse> => {
	const { response } = error
	const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

	// Handle network errors first (no response from server)
	if (!response) {
		// Unknown errors
		if (!error.code) return UNKNOWN_ERROR
		// Network error
		if (error.code === "ERR_NETWORK") return err("NETWORK_ERROR")
		// Timeout error
		if (["ECONNABORTED", "ETIMEDOUT"].includes(error.code)) return err("TIMEOUT_ERROR")
		// Default to unknown error
		return UNKNOWN_ERROR
	}

	// Check if response includes data and is an object
	// An example of invalid response data is when the API server is down and returns a 502 error
	if (!response.data || typeof response.data !== "object") {
		return err("INVALID_RESPONSE")
	}

	const errorCode = (response.data as ErrorResponse)?.code ?? "UNKNOWN_ERROR"

	// Handle 401 errors
	if (response.status === 401) {
		// Attempt to refresh tokens if access token is expired, then retry the originalrequest once
		if (errorCode === "EXPIRED_TOKEN" && !originalRequest._retry) {
			originalRequest._retry = true
			logger.debug(`${errorCode}: Access token expired, attempting to refresh`)
			try {
				// Prevent concurrent refresh attempts
				if (!refreshPromise) {
					refreshPromise = refreshTokens()
				}
				await refreshPromise
				refreshPromise = null // Reset after completion
				// Retry the original request with the new access token
				originalRequest.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`
				return api(originalRequest)
			} catch (refreshError) {
				return Promise.reject(refreshError)
			}
		}

		// Log out if the user is not authenticated (after refresh attempt)
		if (["INVALID_TOKEN", "INVALID_REFRESH_TOKEN"].includes(errorCode)) {
			setTimeout(logOut, 1) // log out on next tick to allow current error to be thrown first
		}
	}

	// Return error response from the server if available, otherwise return unknown error
	return (response?.data as ErrorResponse) ?? UNKNOWN_ERROR
}

/**
 * Check if the access token needs to be refreshed
 * If the token is expired or within 10% of its lifespan, refresh it
 * @param accessToken - The access token to check
 * @returns true if the token needs to be refreshed, false otherwise
 */
const needsTokenRefresh = (accessToken: string) => {
	try {
		const decoded = jwtDecode<JwtPayload>(accessToken)
		const now = Math.floor(Date.now() / 1000)
		const threshold = (decoded.exp - decoded.iat) * 0.1 // 10% of the token's lifespan
		return decoded.exp - now <= threshold
	} catch {
		return true // Refresh if the access token is invalid
	}
}

// Create a new Axios instance
const api = axios.create({
	baseURL: process.env.EXPO_PUBLIC_API_URL,
	headers: {
		"Content-Type": "application/json",
	},
	timeout: 5000, // 5 seconds to accommodate cold starts and network latency
})

// Request interceptor
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
	const { accessToken } = useAuthStore.getState()

	// If the requested endpoint is private (starts with ~)
	if (config.url?.startsWith("~")) {
		config.url = config.url.slice(1) // Remove the leading ~

		if (accessToken) {
			if (needsTokenRefresh(accessToken)) {
				logger.debug("Proactive token refresh initiated")
				try {
					// Prevent concurrent refresh attempts
					if (!refreshPromise) {
						refreshPromise = refreshTokens()
					}
					await refreshPromise
					refreshPromise = null // Reset after completion
					logger.debug("Token refreshed successfully")
					// Attach the new access token to the request
					config.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`
				} catch (refreshError) {
					return Promise.reject(refreshError)
				}
			} else {
				// Token does not need refresh yet, attach it to the request
				config.headers.Authorization = `Bearer ${accessToken}`
			}
		} else {
			// Force log out if the user is not authenticated
			// This is done on the next tick to allow current error to be thrown first
			setTimeout(logOut, 1)
		}
	}

	// Log all requests
	logger.debug(`${config.method?.toUpperCase()} ${config.url?.split("?")[0]}`)

	return config
})

// Response interceptor
api.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		const response = await handleError(error)
		if (response.code) return Promise.reject(response) // failed
		return response // success
	},
)

export const refreshTokens = async () => {
	const refreshToken = useAuthStore.getState().refreshToken
	try {
		if (!refreshToken) {
			setTimeout(logOut, 1) // log out on next tick to allow current error to be thrown first
			throw new Error("No refresh token found, logging out")
		}
		useAuthStore.setState({ isLoading: true, error: null })
		const { data } = await api.post<TokenResponse>("/auth/token/refresh", {
			refreshToken,
		} as RefreshTokensRequest)
		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
		})
	} catch (error) {
		throw setErrorState(error)
	}
}

/**
 * Cleans up Google Sign-In session on logout
 * Google maintains a persistent session that needs to be cleared
 * Safe to call even if user didn't sign in with Google
 */
const cleanupGoogleSignIn = async () => {
	try {
		// Clean up Google Sign-In session (if present)
		// Use require to avoid compile-time dependency
		const { GoogleSignin } = require("@react-native-google-signin/google-signin")
		await GoogleSignin.signOut()
	} catch {
		// Do nothing
	}
}

export const logOut = async () => {
	const { refreshToken } = useAuthStore.getState()
	try {
		// Clean up Google sign-in session
		// Apple sign-in doesn't require cleanup - it's stateless
		await cleanupGoogleSignIn()

		if (!refreshToken) throw new Error("No refresh token found")
		useAuthStore.setState({ isLoading: true, error: null })
		await api.post("/auth/logout", { refreshToken } as LogoutRequest)
	} catch {
		// Do nothing (intentional for logout)
	} finally {
		useAuthStore.getState().clearAll()
	}
}

export { api }
