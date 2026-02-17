import { useEffect } from "react"

import { type SignupScreenParams, useAuthStore, useSignupFlow } from "@prism/auth/expo"
import { Alert, BackButton, Button, colors, Picker, Svg, Text, TextInput } from "@prism/ui/expo"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { TouchableOpacity, View } from "react-native"

import { useLocalSearchParams } from "expo-router"

export default function Signup() {
	const params = useLocalSearchParams() as unknown as SignupScreenParams
	const {
		currentStep,
		currentStepIndex,
		form,
		isLoading,
		birthYearOptions,
		pickerRef,
		isCurrentStepValid,
		handleNext,
		handleBack,
		capitalizeWords,
	} = useSignupFlow(params)
	const { error: storeError } = useAuthStore()

	const insets = useSafeAreaInsets()

	// Display errors from useSignupFlow (which doesn't return error state)
	useEffect(() => {
		if (storeError) {
			Alert.toast({
				variant: "error",
				message: storeError,
			})
		}
	}, [storeError])

	const renderProgressBar = () => {
		const progressPercentage = ((currentStepIndex + 1) / 3) * 100

		// Create progress bar segments to avoid dynamic inline styles
		const renderProgressSegments = () => {
			const segments = []
			for (let i = 0; i < 3; i++) {
				const isActive = i <= currentStepIndex
				segments.push(
					<View
						key={i}
						className={`h-2 flex-1 rounded-full ${isActive ? "bg-indigo-500 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`}
					/>,
				)
			}
			return segments
		}

		return (
			<View className="mb-8">
				<View className="mb-2 flex-row justify-between">
					<Text className="text-sm font-medium">Step {currentStepIndex + 1} of 3</Text>
					<Text className="text-sm font-medium">{Math.round(progressPercentage)}%</Text>
				</View>
				<View className="flex-row gap-1">{renderProgressSegments()}</View>
			</View>
		)
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case "name":
				return (
					<View className="mb-8">
						<Text className="mb-2 font-medium">What&apos;s your full name?</Text>
						<TextInput
							autoFocus
							placeholder="Enter your full name"
							value={form.data.name}
							onChangeText={(text: string) => form.set("name", capitalizeWords(text))}
							onBlur={() => form.validate("name")}
							returnKeyType="next"
							submitBehavior="submit"
							onSubmitEditing={isCurrentStepValid() ? handleNext : undefined}
							variant={form.errors.name ? "error" : undefined}
						/>
						{form.errors.name && (
							<Text variant="error" className="mt-1 text-sm">
								{form.errors.name}
							</Text>
						)}
						<Text variant="secondary" className="mt-2 text-sm">
							Please enter your full name
						</Text>
					</View>
				)

			case "birthYear":
				return (
					<View>
						<Text className="mb-2 font-medium">What&apos;s your birth year?</Text>
						<Picker
							ref={pickerRef}
							items={birthYearOptions}
							selectedValue={form.data.birthYear ?? undefined}
							onValueChange={(value: string | number) => form.set("birthYear", value)}
							placeholder="Select your birth year"
							modalTitle="Select your birth year"
							itemAlignment="center"
						/>
						{form.errors.birthYear && (
							<Text variant="error" className="mt-1 text-sm">
								{form.errors.birthYear}
							</Text>
						)}
						<Text variant="secondary" className="mt-2 text-sm">
							You must be at least 13 years old
						</Text>
					</View>
				)

			case "gender":
				return (
					<View>
						<Text className="mb-2 font-medium">What&apos;s your gender?</Text>
						<View className="flex-row gap-4">
							{[
								{ value: "male", label: "Male", icon: "male" },
								{ value: "female", label: "Female", icon: "female" },
							].map(({ value, label, icon }) => (
								<View key={value} className="flex-1">
									<TouchableOpacity
										className={`w-full items-center justify-center rounded-lg border-2 py-4 ${
											form.data.gender === value
												? "border-indigo-600 bg-indigo-200/50 dark:border-indigo-500 dark:bg-indigo-900/50"
												: "border-slate-200 dark:border-slate-700"
										}`}
										onPress={() => form.set("gender", value)}
										activeOpacity={1}
									>
										<Svg
											name={icon as "male" | "female"}
											width={28}
											height={28}
											lightColor={
												form.data.gender === value ? colors.indigo[600] : colors.slate[500]
											}
											darkColor={
												form.data.gender === value ? colors.indigo[400] : colors.slate[400]
											}
										/>
										<Text
											className={`mt-2 ${
												form.data.gender === value
													? "text-indigo-800 dark:text-indigo-200"
													: "text-slate-800 dark:text-slate-200"
											}`}
										>
											{label}
										</Text>
									</TouchableOpacity>
								</View>
							))}
						</View>
						{form.errors.gender && (
							<Text variant="error" className="mt-1 text-sm">
								{form.errors.gender}
							</Text>
						)}
						<Text variant="secondary" className="mt-2 text-sm">
							This helps us personalize your experience
						</Text>
					</View>
				)

			default:
				return null
		}
	}

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
					<Text className="mb-2 text-3xl font-semibold">Create your account</Text>
					<Text variant="secondary">Complete your profile to get started</Text>
				</View>

				{renderProgressBar()}
				{renderStepContent()}

				<View className={`flex-1 ${currentStep !== "name" ? "justify-end" : ""}`}>
					<Button disabled={isLoading || !isCurrentStepValid()} onPress={handleNext}>
						{isLoading ? "Please wait..." : "Next"}
					</Button>
				</View>
			</View>
		</KeyboardAwareScrollView>
	)
}
