import { useEffect } from "react"

import { type OtpScreenParams, useOtpFlow } from "@the/auth/expo"
import { Alert, BackButton, Button, OtpInput, Text } from "@the/ui/expo"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { View } from "react-native"

import { useLocalSearchParams } from "expo-router"

export default function Otp() {
	const params = useLocalSearchParams() as unknown as OtpScreenParams
	const {
		resendTimer,
		isLoading,
		error,
		otpInputRef,
		handleVerifyOtp,
		handleResendOtp,
		handleBack,
	} = useOtpFlow(params)

	const insets = useSafeAreaInsets()

	// Display errors from hook - track message string to prevent duplicate toasts
	useEffect(() => {
		if (error?.message) {
			Alert.toast({
				variant: "error",
				message: error.message,
			})
		}
	}, [error?.message])

	return (
		<KeyboardAwareScrollView
			contentContainerStyle={{ flexGrow: 1 }}
			keyboardShouldPersistTaps="always"
			scrollEnabled={false}
			className="bg-white dark:bg-slate-900"
		>
			<View
				className="flex-1 px-4"
				style={{ paddingTop: insets.top || 20, paddingBottom: insets.bottom || 20 }}
			>
				<BackButton onPress={handleBack} className="mb-4 self-start" />

				<View className="mb-8">
					<Text className="mb-2 text-3xl font-semibold">Verify your phone</Text>
					<Text variant="secondary">
						We sent a 6-digit OTP code to your phone via SMS. Enter it below to verify your account.
					</Text>
				</View>

				<OtpInput
					ref={otpInputRef}
					length={6}
					onComplete={handleVerifyOtp}
					autoFocus
					disabled={isLoading}
				/>

				<View className="mt-8 flex-1 justify-end">
					<Button
						variant="outline"
						disabled={resendTimer > 0 || isLoading}
						onPress={handleResendOtp}
					>
						{resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
					</Button>
				</View>
			</View>
		</KeyboardAwareScrollView>
	)
}
