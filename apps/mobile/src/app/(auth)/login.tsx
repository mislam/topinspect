import { useEffect } from "react"

import { useAppleSignIn, useAuthStore, useGoogleSignIn, usePhoneSignIn } from "@the/auth/expo"
import { Alert, Button, colors, Svg, Text, TextInput } from "@the/ui/expo"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ActivityIndicator, useColorScheme, View } from "react-native"

import * as WebBrowser from "expo-web-browser"

import { AUTH_CONFIG } from "@/config/auth"

export default function Login() {
	const insets = useSafeAreaInsets()
	const isDark = useColorScheme() === "dark"
	const phoneSignIn = usePhoneSignIn()
	const googleSignIn = useGoogleSignIn()
	const appleSignIn = useAppleSignIn()
	const { error: storeError } = useAuthStore()

	// Spinner color for outline buttons (matches text color)
	const outlineSpinnerColor = isDark ? colors.slate[200] : colors.slate[800]

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
			contentContainerStyle={{ flexGrow: 1 }}
			keyboardShouldPersistTaps="always"
			scrollEnabled={false}
			className="bg-white dark:bg-slate-900"
		>
			<View
				className="flex-1 px-4"
				style={{ paddingTop: insets.top || 20, paddingBottom: insets.bottom || 20 }}
			>
				<View className="gap-8">
					{/* Logo */}
					<View className="mt-4 items-center">
						<Svg name="logo" width={64} height={64} />
					</View>

					{/* Title */}
					<View className="items-center">
						<View style={{ flexShrink: 0 }}>
							<Text className="text-2xl font-bold" numberOfLines={1}>
								Welcome
							</Text>
						</View>
						<Text variant="secondary">Sign in to continue with your account</Text>
					</View>

					{/* Phone Sign-In (if enabled) */}
					{AUTH_CONFIG.phone && (
						<View className="gap-4">
							<View>
								<Text className="mb-1 font-medium">Phone Number</Text>
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
									<Text variant="error" className="mt-1 text-sm">
										{phoneSignIn.form.errors.phone}
									</Text>
								)}
								<Text variant="secondary" className="mt-2 text-sm">
									Enter your 10-digit U.S. phone number
								</Text>
							</View>

							<Button
								onPress={phoneSignIn.handleSendOtp}
								disabled={phoneSignIn.isLoading || phoneSignIn.form.data.phone.trim().length !== 10}
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
					<View className="gap-3">
						{AUTH_CONFIG.google && (
							<Button
								onPress={googleSignIn.handleGoogleSignIn}
								disabled={googleSignIn.isLoading}
								variant="outline"
							>
								<View className="flex-row items-center justify-center">
									{googleSignIn.isLoading ? (
										<ActivityIndicator size="small" color={outlineSpinnerColor} className="mr-1" />
									) : (
										<Svg name="google" width={24} height={24} />
									)}
									<Text className="ml-2 text-center text-base font-semibold">
										Continue with Google
									</Text>
								</View>
							</Button>
						)}
						{AUTH_CONFIG.apple && appleSignIn.isAvailable && (
							<Button
								onPress={appleSignIn.handleAppleSignIn}
								disabled={appleSignIn.isLoading}
								variant="outline"
							>
								<View className="flex-row items-center justify-center">
									{appleSignIn.isLoading ? (
										<ActivityIndicator size="small" color={outlineSpinnerColor} className="mr-1" />
									) : (
										<Svg name="apple" width={24} height={24} />
									)}
									<Text className="ml-2 text-center text-base font-semibold">
										Continue with Apple
									</Text>
								</View>
							</Button>
						)}
					</View>

					{/* Terms of Service and Privacy Policy */}
					<Text variant="secondary" className="text-center text-xs">
						By continuing, you agree to our{" "}
						<Text
							variant="secondary"
							className="text-xs font-semibold"
							onPress={() => handleOpenUrl(TERMS_URL)}
						>
							Terms
						</Text>{" "}
						and{" "}
						<Text
							variant="secondary"
							className="text-xs font-semibold"
							onPress={() => handleOpenUrl(PRIVACY_URL)}
						>
							Privacy Policy
						</Text>
					</Text>
				</View>
			</View>
		</KeyboardAwareScrollView>
	)
}
