import { useEffect, useRef, useState } from "react"

import { oauthSignupSchema, phoneSignupSchema } from "@prism/schemas"
import { useForm } from "@prism/utils/expo"
import { capitalizeWords } from "@prism/utils/shared"

import { router } from "expo-router"

import { AUTH_ROUTES, TIMING } from "../constants"
import { sendOtp, signUpWithOAuth } from "../service"
import { useAuthStore } from "../store"

import { navigateToHome } from "./utils"

import type { SignupScreenParams } from "../config"
import type { PickerItem, PickerRef } from "@prism/ui/expo"

export type SignupStep = "name" | "birthYear" | "gender"

export function useSignupFlow(params: SignupScreenParams) {
	const { phone, provider, providerId, email } = params
	const [currentStep, setCurrentStep] = useState<SignupStep>("name")
	const { isLoading } = useAuthStore()
	const pickerRef = useRef<PickerRef>(null)

	// Determine signup mode: phone or OAuth
	const isOAuthSignup = !!provider && !!providerId

	// Always call both hooks (React rules), but only use the relevant one
	const phoneForm = useForm(phoneSignupSchema, { phone: phone || "" })
	const oauthForm = useForm(oauthSignupSchema, {
		provider: (provider as "google" | "apple") || "google",
		providerId: providerId || "",
		email: email || "",
	})
	const form = isOAuthSignup ? oauthForm : phoneForm

	// Generate birth year options (1900 to current year - 13)
	const birthYearOptions: PickerItem[] = (() => {
		const currentYear = new Date().getFullYear()
		const maxBirthYear = currentYear - 13 // Must be at least 13 years old
		const years: PickerItem[] = []

		// Generate years from max birth year down to 1900
		for (let year = maxBirthYear; year >= 1900; year--) {
			years.push({
				label: year.toString(),
				value: year,
			})
		}

		return years
	})()

	const steps: SignupStep[] = ["name", "birthYear", "gender"]
	const currentStepIndex = steps.indexOf(currentStep)

	// Step validation helper - check errors without triggering validation
	const isCurrentStepValid = () => {
		switch (currentStep) {
			case "name":
				return !form.errors.name && form.data.name.trim()
			case "birthYear":
				return !form.errors.birthYear && form.data.birthYear
			case "gender":
				return !form.errors.gender && form.data.gender
			default:
				return false
		}
	}

	// Auto-open picker when step changes to birthYear
	useEffect(() => {
		if (currentStep === "birthYear") {
			// Small delay to ensure the component is rendered
			const timer = setTimeout(() => {
				pickerRef.current?.open()
			}, TIMING.PICKER_OPEN_DELAY)
			return () => clearTimeout(timer)
		}
	}, [currentStep])

	const handleNext = () => {
		if (currentStep === "name") {
			if (!form.validate("name")) return
			setCurrentStep("birthYear")
		} else if (currentStep === "birthYear") {
			if (!form.validate("birthYear")) return
			setCurrentStep("gender")
		} else if (currentStep === "gender") {
			if (!form.validate("gender")) return
			handleCompleteSignup()
		}
	}

	const handleBack = () => {
		if (currentStep === "name") {
			router.back()
		} else {
			const prevStep = steps[currentStepIndex - 1]
			setCurrentStep(prevStep)
		}
	}

	const handleCompleteSignup = async () => {
		if (isOAuthSignup) {
			// OAuth signup - complete directly
			if (!provider || !providerId) return
			try {
				await signUpWithOAuth({
					provider: provider as "google" | "apple",
					providerId,
					email: email || "",
					name: form.data.name,
					gender: form.data.gender,
					birthYear: form.data.birthYear,
				})
				navigateToHome()
			} catch {
				// Error is already handled in the store
			}
		} else {
			// Phone signup - send OTP first
			if (!phone) return
			try {
				await sendOtp({ phone, purpose: "signup" })
				router.push({
					pathname: AUTH_ROUTES.OTP,
					params: {
						phone,
						purpose: "signup",
						name: form.data.name,
						gender: form.data.gender,
						birthYear: form.data.birthYear.toString(),
					},
				})
			} catch {
				// Error is already handled in the store
			}
		}
	}

	return {
		// State
		currentStep,
		currentStepIndex,
		form,
		isLoading,
		birthYearOptions,
		pickerRef,
		// Validation
		isCurrentStepValid,
		// Handlers
		handleNext,
		handleBack,
		handleCompleteSignup,
		// Helpers
		capitalizeWords,
	}
}
