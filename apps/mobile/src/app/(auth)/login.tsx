import { useEffect } from "react"

import { useAppleSignIn, useAuthStore, useGoogleSignIn, usePhoneSignIn } from "@prism/auth/expo"
import { Alert, Button, colors, Svg, Text, TextInput } from "@prism/ui/expo"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ActivityIndicator, ImageBackground, View } from "react-native"

import * as WebBrowser from "expo-web-browser"

import { AUTH_CONFIG } from "@/config/auth"

export default function Login() {
	const insets = useSafeAreaInsets()
	const phoneSignIn = usePhoneSignIn()
	const googleSignIn = useGoogleSignIn()
	const appleSignIn = useAppleSignIn()
	const { error: storeError } = useAuthStore()

	// Display errors from hooks - track message string to prevent duplicate toasts
	useEffect(() => {
		if (googleSignIn.error?.message) {
			Alert.toast({
				variant: "error",
				title: googleSignIn.error.title,
				message: googleSignIn.error.message,
			})
		}
	}, [googleSignIn.error?.message, googleSignIn.error?.title])

	useEffect(() => {
		if (appleSignIn.error?.message) {
			Alert.toast({
				variant: "error",
				title: appleSignIn.error.title,
				message: appleSignIn.error.message,
			})
		}
	}, [appleSignIn.error?.message, appleSignIn.error?.title])

	// Display errors from usePhoneSignIn (which doesn't return error state)
	useEffect(() => {
		if (storeError) {
			Alert.toast({
				variant: "error",
				message: storeError,
			})
		}
	}, [storeError])

	const handleOpenUrl = async (url: string) => {
		await WebBrowser.openBrowserAsync(url)
	}

	const TERMS_URL = "https://opensource.org/tos"
	const PRIVACY_URL = "https://opensource.org/privacy"

	return (
		<KeyboardAwareScrollView
			contentContainerClassName="flex-grow"
			keyboardShouldPersistTaps="always"
			scrollEnabled={false}
		>
			<ImageBackground
				source={require("@assets/images/login-bg.jpg")}
				resizeMode="cover"
				className="h-screen w-screen px-4"
				style={{ paddingTop: insets.top || 20, paddingBottom: insets.bottom || 20 }}
			>
				<View className="z-10 mx-auto w-full flex-1 sm:w-[480px]">
					<View className="gap-8">
						{/* Logo */}
						<View className="mt-4 items-center">
							<Svg name="logo" width={64} height={64} color={colors.white} />
						</View>

						{/* Phone Sign-In (if enabled) */}
						{AUTH_CONFIG.phone && (
							<View className="gap-4">
								<View>
									<Text className="mb-1 font-medium text-white">Phone Number</Text>
									<TextInput
										ref={phoneSignIn.phoneInputRef}
										placeholder="9876543210"
										value={phoneSignIn.form.data.phone}
										onChangeText={(value: string) => phoneSignIn.form.set("phone", value)}
										onBlur={() => phoneSignIn.form.validate("phone")}
										keyboardType="number-pad"
										maxLength={10}
										variant={phoneSignIn.form.errors.phone ? "error" : undefined}
									/>
									{phoneSignIn.form.errors.phone && (
										<Text variant="error" className="mt-1 text-sm text-red-400">
											{phoneSignIn.form.errors.phone}
										</Text>
									)}
									<Text variant="secondary" className="mt-2 text-sm text-slate-400">
										Enter your 10-digit U.S. phone number
									</Text>
								</View>

								<Button
									onPress={phoneSignIn.handleSendOtp}
									disabled={
										phoneSignIn.isLoading || phoneSignIn.form.data.phone.trim().length !== 10
									}
								>
									<View className="flex-row items-center justify-center">
										{phoneSignIn.isLoading && (
											<ActivityIndicator size="small" color="white" className="mr-2" />
										)}
										<Text className="text-center text-base font-semibold">Continue</Text>
									</View>
								</Button>
							</View>
						)}
					</View>

					<View className="flex-1 justify-end gap-6">
						{/* Social Sign-In Buttons */}
						<View className="gap-4">
							{AUTH_CONFIG.google && (
								<Button
									onPress={googleSignIn.handleGoogleSignIn}
									disabled={googleSignIn.isLoading}
									className="border-white bg-white disabled:border-white disabled:bg-white dark:border-white dark:bg-white disabled:dark:border-white disabled:dark:bg-white"
								>
									<View className="flex-row items-center justify-center">
										{googleSignIn.isLoading ? (
											<ActivityIndicator size="small" color={colors.slate[800]} className="mr-1" />
										) : (
											<Svg name="google" width={24} height={24} />
										)}
										<Text className="ml-2 text-center text-base font-semibold text-slate-800 dark:text-slate-800">
											Continue with Google
										</Text>
									</View>
								</Button>
							)}
							{AUTH_CONFIG.apple && appleSignIn.isAvailable && (
								<Button
									onPress={appleSignIn.handleAppleSignIn}
									disabled={appleSignIn.isLoading}
									className="border-white bg-white disabled:border-white disabled:bg-white dark:border-white dark:bg-white disabled:dark:border-white disabled:dark:bg-white"
								>
									<View className="flex-row items-center justify-center">
										{appleSignIn.isLoading ? (
											<ActivityIndicator size="small" color={colors.slate[800]} className="mr-1" />
										) : (
											<Svg name="apple" width={24} height={24} color={colors.slate[800]} />
										)}
										<Text className="ml-2 text-center text-base font-semibold text-slate-800 dark:text-slate-800">
											Continue with Apple
										</Text>
									</View>
								</Button>
							)}
						</View>

						{/* Terms of Service and Privacy Policy */}
						<Text variant="secondary" className="text-center text-xs text-slate-400">
							By continuing, you agree to our{" "}
							<Text
								variant="secondary"
								className="text-xs font-semibold text-slate-300"
								onPress={() => handleOpenUrl(TERMS_URL)}
							>
								Terms
							</Text>{" "}
							and{" "}
							<Text
								variant="secondary"
								className="text-xs font-semibold text-slate-300"
								onPress={() => handleOpenUrl(PRIVACY_URL)}
							>
								Privacy Policy
							</Text>
						</Text>
					</View>
				</View>
			</ImageBackground>
		</KeyboardAwareScrollView>
	)
}
