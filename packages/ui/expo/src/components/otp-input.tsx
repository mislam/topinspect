import { forwardRef, memo, useImperativeHandle, useRef, useState } from "react"

import { cn, logger } from "@prism/utils/expo"

import {
	TextInput as RNTextInput,
	type TextInputProps as RNTextInputProps,
	Text,
	View,
} from "react-native"

import { otpInputBase, type OtpInputVariant, otpInputVariants } from "../theme"

// Ref interface for OTP input
export interface OtpInputRef {
	reset: () => void
}

export interface OtpInputProps extends Omit<RNTextInputProps, "style" | "value" | "onChangeText"> {
	length?: number // Number of OTP digits (default: 6)
	className?: string // Custom container class names
	disabled?: boolean // Whether the input is disabled

	// Callback when OTP is complete - return true for success, false for error
	onComplete?: (otp: string) => Promise<boolean> | boolean
}

export const OtpInput = memo(
	forwardRef<OtpInputRef, OtpInputProps>(
		({ length = 6, className = "", disabled = false, onComplete, ...props }, ref) => {
			const inputRef = useRef<RNTextInput>(null)
			const [otp, setOtp] = useState("")
			const [variant, setVariant] = useState<OtpInputVariant>("default")

			// Helper function to handle error state
			const handleError = () => {
				setOtp("")
				setVariant("error")
				setTimeout(() => inputRef.current?.focus(), 50)
			}

			// Expose reset function to parent via ref
			useImperativeHandle(ref, () => ({
				reset: () => {
					setOtp("")
					setVariant("default")
					inputRef.current?.focus()
				},
			}))

			// Create OTP digits array for display
			const otpDigits = Array.from({ length }, (_, index) => otp[index] || "")

			// Handle text input changes
			const handleTextChange = async (text: string) => {
				const numericText = text.replace(/\D/g, "")
				const limitedText = numericText.slice(0, length)

				setOtp(limitedText)

				if (limitedText.length === length && onComplete) {
					try {
						const result = await onComplete(limitedText)
						if (!result) {
							// Auto-reset on error
							handleError()
							return // Exit early for error case
						}
						setVariant("success")
					} catch (error) {
						setVariant("error")
						logger.debug("Error in onComplete callback", { error })
					}
				}
			}

			return (
				<View
					className={cn("flex-row justify-between", className)}
					onTouchEnd={() => inputRef.current?.focus()}
				>
					{/* Hidden TextInput for actual input handling */}
					<RNTextInput
						ref={inputRef}
						value={otp}
						onChangeText={handleTextChange}
						keyboardType="number-pad"
						maxLength={length}
						selectTextOnFocus={false}
						caretHidden
						contextMenuHidden
						editable={!disabled}
						style={{
							position: "absolute",
							left: -9999,
							top: -9999,
							width: 1,
							height: 1,
							opacity: 0,
						}}
						{...props}
					/>

					{/* Visual digit display */}
					{otpDigits.map((digit: string, index: number) => (
						<Text
							key={`otp-digit-${index}`}
							className={cn(otpInputBase, otpInputVariants[variant])}
						>
							{digit}
						</Text>
					))}
				</View>
			)
		},
	),
)

OtpInput.displayName = "OtpInput"
