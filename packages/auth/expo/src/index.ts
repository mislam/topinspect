export {
	sendOtp,
	signInWithPhone,
	signUpWithPhone,
	signInWithGoogle,
	signInWithApple,
	signUpWithOAuth,
	refreshTokens,
	logOut,
} from "./service"
export { useAuthStore } from "./store"
export { setErrorState } from "./util"
export { api } from "./api"

// Hooks
export { useSignupFlow, type SignupStep } from "./hooks/useSignupFlow"
export { useOtpFlow, type OtpError } from "./hooks/useOtpFlow"
export { usePhoneSignIn } from "./hooks/usePhoneSignIn"
export { useGoogleSignIn, type GoogleSignInError } from "./hooks/useGoogleSignIn"
export { useAppleSignIn, type AppleSignInError } from "./hooks/useAppleSignIn"

// Config types
export type { AuthConfig, OtpScreenParams, SignupScreenParams } from "./config"
