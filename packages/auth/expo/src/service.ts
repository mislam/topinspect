import {
	type OAuthSignInRequest,
	type OAuthSignupRequest,
	type OtpRequest,
	type PhoneSignInRequest,
	type PhoneSignupRequest,
} from "@the/schemas"
import { type OtpResponse, type TokenResponse } from "@the/types"
import { getDeviceInfo } from "@the/utils/expo"

import { api, logOut, refreshTokens } from "./api"
import { useAuthStore } from "./store"
import { setErrorState } from "./util"

/**
 * Injects device info into the request
 * @param req - The request object
 */
const injectDeviceInfo = (
	req: PhoneSignupRequest | PhoneSignInRequest | OAuthSignInRequest | OAuthSignupRequest,
) => {
	req.deviceInfo = getDeviceInfo()
}

export const sendOtp = async (req: OtpRequest) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		const { data } = await api.post<OtpResponse>("/auth/phone/otp", req)
		useAuthStore.setState({ isLoading: false })
		return { userExists: data.userExists }
	} catch (error) {
		throw setErrorState(error)
	}
}

export const signUpWithPhone = async (req: PhoneSignupRequest) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		injectDeviceInfo(req)
		const { data } = await api.post<TokenResponse>("/auth/phone/signup", req)
		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			isAuthenticated: true,
		})
		useAuthStore.getState().clearUI()
	} catch (error) {
		throw setErrorState(error)
	}
}

export const signInWithPhone = async (req: PhoneSignInRequest) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		injectDeviceInfo(req)
		const { data } = await api.post<TokenResponse>("/auth/phone/login", req)
		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			isAuthenticated: true,
		})
		useAuthStore.getState().clearUI()
	} catch (error) {
		throw setErrorState(error)
	}
}

export const signInWithGoogle = async (idToken: string) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		const req: OAuthSignInRequest = { idToken }
		injectDeviceInfo(req)
		const { data } = await api.post<TokenResponse>("/auth/google", req)

		// Check if signup is needed
		if (data.needsSignup && data.provider && data.providerId) {
			useAuthStore.setState({ isLoading: false })
			return {
				needsSignup: true,
				provider: data.provider,
				providerId: data.providerId,
				email: data.email,
			}
		}

		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			isAuthenticated: true,
		})
		useAuthStore.getState().clearUI()
		return { needsSignup: false }
	} catch (error) {
		throw setErrorState(error)
	}
}

export const signInWithApple = async (idToken: string) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		const req: OAuthSignInRequest = { idToken }
		injectDeviceInfo(req)
		const { data } = await api.post<TokenResponse>("/auth/apple", req)

		// Check if signup is needed
		if (data.needsSignup && data.provider && data.providerId) {
			useAuthStore.setState({ isLoading: false })
			return {
				needsSignup: true,
				provider: data.provider,
				providerId: data.providerId,
				email: data.email,
			}
		}

		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			isAuthenticated: true,
		})
		useAuthStore.getState().clearUI()
		return { needsSignup: false }
	} catch (error) {
		throw setErrorState(error)
	}
}

export const signUpWithOAuth = async (req: OAuthSignupRequest) => {
	useAuthStore.setState({ isLoading: true, error: null })
	try {
		injectDeviceInfo(req)
		const { data } = await api.post<TokenResponse>("/auth/oauth/signup", req)
		useAuthStore.setState({
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			isAuthenticated: true,
		})
		useAuthStore.getState().clearUI()
	} catch (error) {
		throw setErrorState(error)
	}
}

export { refreshTokens, logOut } // implemented in api.ts to avoid circular dependency
