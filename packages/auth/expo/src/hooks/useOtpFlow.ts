import { useEffect, useRef, useState } from "react"

import { router } from "expo-router"

import { TIMING } from "../constants"
import { sendOtp, signInWithPhone, signUpWithPhone } from "../service"
import { useAuthStore } from "../store"

import { navigateToHome } from "./utils"

import type { OtpScreenParams } from "../config"

export type OtpError = {
	type: "validation" | "api"
	message: string
} | null

export function useOtpFlow(params: OtpScreenParams) {
	const { phone, purpose, name, gender, birthYear } = params
	const [resendTimer, setResendTimer] = useState<number>(TIMING.OTP_RESEND_COOLDOWN)
	const [error, setError] = useState<OtpError>(null)
	const otpInputRef = useRef<{ reset: () => void }>(null)

	const { isLoading, error: storeError, clearError } = useAuthStore()

	// Resend timer effect
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
			return () => clearTimeout(timer)
		}
	}, [resendTimer])

	const handleVerifyOtp = async (code: string): Promise<boolean> => {
		if (!phone) {
			setError({ type: "validation", message: "Phone number not found" })
			return false
		}

		try {
			clearError()
			setError(null)

			if (purpose === "signup") {
				// For signup, use the stored signup data
				if (!name || !gender || !birthYear) {
					setError({ type: "validation", message: "Signup data not found. Please try again." })
					return false
				}

				await signUpWithPhone({
					phone,
					code,
					name,
					gender: gender as "male" | "female",
					birthYear: parseInt(birthYear),
				})
				navigateToHome()
				return true
			} else {
				// For login, proceed with login
				await signInWithPhone({ phone, code })
				navigateToHome()
				return true
			}
		} catch {
			// Error is already handled in the store
			return false
		}
	}

	const handleResendOtp = async (): Promise<void> => {
		if (!phone) {
			setError({ type: "validation", message: "Phone number not found" })
			return
		}

		try {
			clearError()
			setError(null)
			await sendOtp({ phone, purpose })
			setResendTimer(TIMING.OTP_RESEND_COOLDOWN) // Start cooldown timer
			otpInputRef.current?.reset() // Reset OTP input
		} catch {
			// Error is already handled in the store
		}
	}

	const handleBack = () => {
		router.back()
	}

	return {
		// State
		resendTimer,
		isLoading,
		error:
			error || (storeError ? ({ type: "api" as const, message: storeError } as OtpError) : null),
		otpInputRef,
		// Handlers
		handleVerifyOtp,
		handleResendOtp,
		handleBack,
	}
}
