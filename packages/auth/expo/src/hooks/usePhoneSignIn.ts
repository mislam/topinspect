import { useEffect, useRef, useState } from "react"

import { otpRequestSchema } from "@prism/schemas"
import { useForm } from "@prism/utils/expo"

import { type TextInput as RNTextInput } from "react-native"

import { TIMING } from "../constants"
import { sendOtp } from "../service"

import { navigateToOtp, navigateToPhoneSignup } from "./utils"

export function usePhoneSignIn() {
	const [isLoading, setIsLoading] = useState(false)
	const phoneInputRef = useRef<RNTextInput>(null)
	const form = useForm(otpRequestSchema, { purpose: "login" })

	// Programmatically auto-focus phone TextInput after component loads
	useEffect(() => {
		const timer = setTimeout(() => {
			phoneInputRef.current?.focus()
		}, TIMING.AUTO_FOCUS_DELAY)
		return () => clearTimeout(timer)
	}, [])

	const handleSendOtp = async () => {
		// Abort if validation fails
		if (!form.validate("phone")) return

		setIsLoading(true)
		try {
			const { userExists } = await sendOtp(form.data)

			if (userExists) {
				// User exists, go to OTP screen
				navigateToOtp(form.data.phone, "login")
			} else {
				// User doesn't exist, go to signup
				navigateToPhoneSignup(form.data.phone)
			}
		} catch {
			// Error is already handled in the store, no need to handle it here
		} finally {
			setIsLoading(false)
		}
	}

	return {
		// State
		form,
		isLoading,
		phoneInputRef,
		// Handlers
		handleSendOtp,
	}
}
