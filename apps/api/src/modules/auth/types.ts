type OtpErrorCode = "OTP_NOT_FOUND" | "OTP_EXPIRED" | "OTP_MAX_ATTEMPTS" | "OTP_INVALID"

interface OtpVerificationSuccess {
	success: true
}

interface OtpVerificationFailure {
	success: false
	errorCode: OtpErrorCode
	error: string
}

// OTP verification result type
export type OtpVerificationResult = OtpVerificationSuccess | OtpVerificationFailure
