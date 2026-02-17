import { useRef, useState } from "react"

import {
	Alert,
	Button,
	colors,
	Icon,
	OtpInput,
	type OtpInputRef,
	Picker,
	type PickerItem,
	type PickerRef,
	Svg,
	Text,
	TextInput,
} from "@prism/ui/expo"
import { logger } from "@prism/utils/expo"

import { ScrollView, View } from "react-native"

import { router } from "expo-router"

export default function DemoScreen() {
	const buttonVariants = ["default", "outline", "danger"] as const
	const [textInputValue, setTextInputValue] = useState("")
	const [textInputVariant, setTextInputVariant] = useState<
		"default" | "error" | "success" | "warning"
	>("default")

	// OTP demo state
	const [isLoading, setIsLoading] = useState(false)
	const otpInputRef = useRef<OtpInputRef>(null)

	// Picker demo state
	const [pickerValue, setPickerValue] = useState<string | number>("")
	const [pickerVariant, setPickerVariant] = useState<"default" | "error" | "success" | "warning">(
		"default",
	)
	const pickerRef = useRef<PickerRef>(null)

	// Sample picker data
	const sampleItems: PickerItem[] = [
		{ label: "Apple", value: "apple" },
		{ label: "Banana", value: "banana" },
		{ label: "Cherry", value: "cherry" },
		{ label: "Date", value: "date" },
		{ label: "Elderberry", value: "elderberry" },
		{ label: "Fig", value: "fig" },
		{ label: "Grape", value: "grape" },
		{ label: "Honeydew", value: "honeydew" },
		{ label: "Kiwi", value: "kiwi" },
		{ label: "Lemon", value: "lemon" },
		{ label: "Mango", value: "mango" },
		{ label: "Orange", value: "orange" },
		{ label: "Papaya", value: "papaya" },
		{ label: "Quince", value: "quince" },
		{ label: "Raspberry", value: "raspberry" },
		{ label: "Strawberry", value: "strawberry" },
		{ label: "Tangerine", value: "tangerine" },
		{ label: "Ugli fruit", value: "ugli" },
		{ label: "Vanilla", value: "vanilla" },
		{ label: "Watermelon", value: "watermelon" },
	]

	// Alert demo state - inline alerts are now static (no state needed)

	const handleOtpComplete = async (otp: string) => {
		setIsLoading(true)

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Simulate success/failure
			if (otp === "123456") {
				logger.debug("OTP verified successfully!")
				return true // Success
			} else {
				logger.debug("Invalid OTP! Please check and try again.")
				return false // Error
			}
		} catch (error) {
			logger.debug("Something went wrong. Please try again.", { error })
			return false // Error
		} finally {
			setIsLoading(false)
		}
	}

	const handleOtpClear = () => {
		otpInputRef.current?.reset()
	}

	// Toast demo functions
	const showSuccessToast = () => {
		Alert.toast({
			variant: "success",
			title: "Success!",
			message: "Your data has been saved successfully.",
			showIcon: true,
		})
	}

	const showErrorToast = () => {
		Alert.toast({
			variant: "error",
			title: "Connection Failed",
			message: "Unable to connect to the server. Please check your internet connection.",
			showIcon: true,
			dismiss: "5s", // Auto-dismiss after 5 seconds
		})
	}

	const showWarningToast = () => {
		Alert.toast({
			variant: "warning",
			title: "Low Storage",
			message: "You're running low on storage space. Consider freeing up some space.",
			showIcon: true,
			dismiss: "manual", // Stays forever until manually closed
		})
	}

	const showInfoToast = () => {
		Alert.toast({
			variant: "info",
			title: "New Feature Available",
			message: "Check out our latest update with new features and improvements!",
			showIcon: true,
			dismiss: "auto", // Auto-dismiss based on message length
		})
	}

	const showSimpleToast = () => {
		Alert.toast({
			message: "Simple toast with just a message and no icon.",
			dismiss: "auto", // Auto-dismiss based on message length
		})
	}

	// Picker demo functions
	const handlePickerChange = (value: string | number, index: number) => {
		setPickerValue(value)
		logger.debug("Picker changed:", { value, index })
	}

	const openPickerProgrammatically = () => {
		pickerRef.current?.open()
	}

	return (
		<>
			<View className="bg-white p-4 pt-16 dark:bg-slate-900">
				<Button variant="outline" onPress={() => router.back()}>
					Back to Login
				</Button>
			</View>
			<ScrollView className="flex-1 bg-white dark:bg-slate-900">
				<View className="mb-80 p-4">
					<Text className="mb-5 text-4xl font-bold">UI Components Demo</Text>

					{/* Text Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">Text Component</Text>
						<Text className="mb-4 text-slate-700 dark:text-slate-300">
							All text variants meet <Text className="font-bold">WCAG AAA</Text> accessibility
							standards with proper contrast ratios.
						</Text>

						<Text className="mb-2 text-4xl font-bold">Heading 1 (36px, Bold)</Text>
						<Text className="mb-2 text-3xl font-bold">Heading 2 (30px, Bold)</Text>
						<Text className="mb-2 text-2xl font-semibold">Heading 3 (24px, Semibold)</Text>
						<Text className="mb-2">
							Default text (16px, Normal) - Main content and descriptions
						</Text>
						<Text className="mb-2 text-sm font-medium">
							Small text (14px, Medium) - Form labels and interactive elements
						</Text>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* Icon Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">Icon Component (Ionicons)</Text>

						{/* Icon Sizes */}
						<View className="mb-6">
							<Text className="mb-2 text-2xl font-semibold">Size (default color)</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Set icons size with default color for automatic light/dark color scheme handling.
							</Text>
							<View className="flex-row flex-wrap gap-8">
								<View className="items-center">
									<Icon name="person" size={16} />
									<Text className="mt-2 text-xs">person</Text>
									<Text className="text-xs">size: 16</Text>
								</View>
								<View className="items-center">
									<Icon name="settings" />
									<Text className="mt-2 text-xs">settings</Text>
									<Text className="text-xs">default: 24</Text>
								</View>
								<View className="items-center">
									<Icon name="heart" size={32} />
									<Text className="mt-2 text-xs">heart</Text>
									<Text className="text-xs">size: 32</Text>
								</View>
								<View className="items-center">
									<Icon name="star" size={48} />
									<Text className="mt-2 text-xs">star</Text>
									<Text className="text-xs">size: 48</Text>
								</View>
							</View>
						</View>

						{/* Icon Colors */}
						<View className="mb-6">
							<Text className="mb-2 text-2xl font-semibold">Single Color</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Use a single custom color for both light/dark modes.
							</Text>
							<View className="flex-row flex-wrap gap-8">
								<View className="items-center">
									<Icon name="checkmark" size={32} color={colors.green[500]} />
									<Text className="mt-2 text-sm font-medium">green-500</Text>
								</View>
								<View className="items-center">
									<Icon name="close" size={32} color={colors.red[500]} />
									<Text className="mt-2 text-sm font-medium">red-500</Text>
								</View>
								<View className="items-center">
									<Icon name="warning" size={32} color={colors.yellow[500]} />
									<Text className="mt-2 text-sm font-medium">yellow-500</Text>
								</View>
								<View className="items-center">
									<Icon name="information" size={32} color={colors.blue[500]} />
									<Text className="mt-2 text-sm font-medium">blue-500</Text>
								</View>
							</View>
						</View>

						{/* Theme-Aware Icons */}
						<View className="mb-6">
							<Text className="mb-2 text-2xl font-semibold">Theme-Aware Colors</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Use two custom colors for automatic switch between light/dark modes.
							</Text>
							<View className="flex-row flex-wrap gap-8">
								<View className="items-center">
									<Icon
										name="home"
										size={32}
										lightColor={colors.indigo[600]}
										darkColor={colors.indigo[400]}
									/>
									<Text className="mt-2 text-sm font-medium">home</Text>
									<Text className="text-sm font-medium">☀️ indigo-600</Text>
									<Text className="text-sm font-medium">🌙 indigo-400</Text>
								</View>
								<View className="items-center">
									<Icon
										name="person"
										size={32}
										lightColor={colors.emerald[500]}
										darkColor={colors.pink[500]}
									/>
									<Text className="mt-2 text-sm font-medium">person</Text>
									<Text className="text-sm font-medium">☀ emerald-500</Text>
									<Text className="text-sm font-medium">🌙 pink-500</Text>
								</View>
								<View className="items-center">
									<Icon
										name="settings"
										size={32}
										lightColor={colors.blue[500]}
										darkColor={colors.purple[500]}
									/>
									<Text className="mt-2 text-sm font-medium">settings</Text>
									<Text className="text-sm font-medium">☀ blue-500</Text>
									<Text className="text-sm font-medium">🌙 purple-500</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* SVG Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">SVG Component</Text>

						{/* SVG Sizes */}
						<View className="mb-6">
							<Text className="mb-2 text-2xl font-semibold">Size (default color)</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Set SVG dimensions with default color for automatic light/dark color scheme
								handling.
							</Text>
							<View className="flex-row flex-wrap gap-8">
								<View className="items-center">
									<Svg name="male" width={24} height={24} />
									<Text className="mt-2 text-xs">male</Text>
									<Text className="text-xs">24x24</Text>
								</View>
								<View className="items-center">
									<Svg name="female" width={32} height={32} />
									<Text className="mt-2 text-xs">female</Text>
									<Text className="text-xs">32x32</Text>
								</View>
								<View className="items-center">
									<Svg name="logo" width={64} height={64} />
									<Text className="mt-2 text-xs">logo</Text>
									<Text className="text-xs">64x64</Text>
								</View>
							</View>
						</View>

						{/* SVG Colors */}
						<View className="mb-6">
							<Text className="mb-2 text-2xl font-semibold">Single Color</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Use a single custom color for both light/dark modes.
							</Text>
							<View className="flex-row flex-wrap gap-8">
								<View className="items-center">
									<Svg name="male" width={32} height={32} color={colors.blue[500]} />
									<Text className="mt-2 text-sm font-medium">blue-500</Text>
								</View>
								<View className="items-center">
									<Svg name="female" width={32} height={32} color={colors.pink[500]} />
									<Text className="mt-2 text-sm font-medium">pink-500</Text>
								</View>
								<View className="items-center">
									<Svg name="logo" width={64} height={64} color={colors.yellow[500]} />
									<Text className="mt-2 text-sm font-medium">yellow-500</Text>
								</View>
							</View>
						</View>

						{/* Theme-Aware SVGs */}
						<View className="mb-6">
							<Text className="mb-2 text-2xl font-semibold">Theme-Aware Colors</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Use two custom colors for automatic switch between light/dark modes.
							</Text>
							<View className="flex-row flex-wrap gap-8">
								<View className="items-center">
									<Svg
										name="male"
										width={32}
										height={32}
										lightColor={colors.indigo[600]}
										darkColor={colors.indigo[400]}
									/>
									<Text className="mt-2 text-sm font-medium">male</Text>
									<Text className="text-sm font-medium">☀️ indigo-600</Text>
									<Text className="text-sm font-medium">🌙 indigo-400</Text>
								</View>
								<View className="items-center">
									<Svg
										name="female"
										width={32}
										height={32}
										lightColor={colors.emerald[500]}
										darkColor={colors.pink[500]}
									/>
									<Text className="mt-2 text-sm font-medium">female</Text>
									<Text className="text-sm font-medium">☀ emerald-500</Text>
									<Text className="text-sm font-medium">🌙 pink-500</Text>
								</View>
								<View className="items-center">
									<Svg
										name="logo"
										width={96}
										height={32}
										lightColor={colors.blue[500]}
										darkColor={colors.purple[500]}
									/>
									<Text className="mt-2 text-sm font-medium">logo</Text>
									<Text className="text-sm font-medium">☀ blue-500</Text>
									<Text className="text-sm font-medium">🌙 purple-500</Text>
								</View>
							</View>
						</View>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* Button Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">Button Component</Text>

						{/* Variants */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Variants and States</Text>
							{buttonVariants.map((variant) => (
								<View key={variant} className="mb-2">
									<Button variant={variant} className="mb-2">
										{variant.charAt(0).toUpperCase() + variant.slice(1)} Button
									</Button>
									<Button variant={variant} disabled className="mb-2">
										Disabled {variant.charAt(0).toUpperCase() + variant.slice(1)} Button
									</Button>
								</View>
							))}
						</View>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* TextInput Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">TextInput Component</Text>

						{/* Variants */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Variants</Text>
							<TextInput placeholder="Default variant" className="mb-2" />
							<TextInput placeholder="Error variant" variant="error" className="mb-2" />
							<TextInput placeholder="Success variant" variant="success" className="mb-2" />
							<TextInput placeholder="Warning variant" variant="warning" className="mb-2" />
						</View>

						{/* Interactive Demo */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Interactive Demo</Text>
							<Text className="mb-3">Click buttons to change the input variant below</Text>
							<View className="mb-3 gap-2">
								<View className="flex-row gap-2">
									<Button
										variant="outline"
										onPress={() => setTextInputVariant("default")}
										className="flex-1"
									>
										Default
									</Button>
									<Button
										variant="outline"
										onPress={() => setTextInputVariant("error")}
										className="flex-1"
									>
										Error
									</Button>
								</View>
								<View className="flex-row gap-2">
									<Button
										variant="outline"
										onPress={() => setTextInputVariant("success")}
										className="flex-1"
									>
										Success
									</Button>
									<Button
										variant="outline"
										onPress={() => setTextInputVariant("warning")}
										className="flex-1"
									>
										Warning
									</Button>
								</View>
							</View>
							<TextInput
								placeholder="Interactive input - try changing variants above"
								variant={textInputVariant}
								value={textInputValue}
								onChangeText={setTextInputValue}
								className="mb-2"
							/>
							<Text>Current variant: {textInputVariant}</Text>
						</View>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* OTP Input Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">OTP Input Component</Text>
						<Text className="mb-4 text-slate-700 dark:text-slate-300">
							A high-performance 6-digit OTP input component with automatic focus management and
							theme support.
						</Text>

						{/* Interactive Demo */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Interactive Demo</Text>
							<Text className="mb-3">
								Enter any 6-digit code. Use &quot;123456&quot; for success, any other code for
								error.
							</Text>

							<OtpInput
								ref={otpInputRef}
								onComplete={handleOtpComplete}
								disabled={isLoading}
								// autoFocus
								className="mb-4"
							/>

							<View className="gap-2">
								<Button
									onPress={handleOtpClear}
									variant="outline"
									disabled={isLoading}
									className="w-full"
								>
									{isLoading ? "Verifying OTP..." : "Clear OTP"}
								</Button>
							</View>
						</View>

						{/* Features */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Key Features</Text>
							<View className="gap-2">
								<Text className="text-slate-700 dark:text-slate-300">
									• Automatic success/error styling based on API response
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Auto-clear and refocus on error
								</Text>
								<Text className="mb-2 text-slate-700 dark:text-slate-300">
									• Programmatic reset via ref
								</Text>
							</View>
						</View>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* Picker Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">Picker Component</Text>
						<Text className="mb-4 text-slate-700 dark:text-slate-300">
							Cross-platform picker component that looks identical on iOS and Android. Tap to open a
							modal with options. Perfect for forms and settings.
						</Text>

						{/* Picker Demo */}
						<View className="mb-6">
							{/* Variant Controls */}
							<Text className="mb-3">Click buttons to change the input variant below</Text>
							<View className="mb-3 gap-2">
								<View className="flex-row gap-2">
									<Button
										variant="outline"
										onPress={() => setPickerVariant("default")}
										className="flex-1"
									>
										Default
									</Button>
									<Button
										variant="outline"
										onPress={() => setPickerVariant("error")}
										className="flex-1"
									>
										Error
									</Button>
								</View>
								<View className="flex-row gap-2">
									<Button
										variant="outline"
										onPress={() => setPickerVariant("success")}
										className="flex-1"
									>
										Success
									</Button>
									<Button
										variant="outline"
										onPress={() => setPickerVariant("warning")}
										className="flex-1"
									>
										Warning
									</Button>
								</View>
							</View>

							{/* Picker */}
							<Picker
								ref={pickerRef}
								items={sampleItems}
								selectedValue={pickerValue}
								onValueChange={handlePickerChange}
								placeholder="Select a fruit..."
								modalTitle="Choose Your Fruit"
								variant={pickerVariant}
								className="mb-3"
							/>

							{/* Programmatic Control */}
							<Button variant="outline" onPress={openPickerProgrammatically} className="mb-2">
								Open Picker Programmatically
							</Button>

							<Text className="text-sm text-slate-600 dark:text-slate-400">
								Selected: {pickerValue || "None"} | Variant: {pickerVariant}
							</Text>
						</View>

						{/* Features */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Key Features</Text>
							<View className="gap-2">
								<Text className="text-slate-700 dark:text-slate-300">
									• Identical appearance on iOS and Android
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Modal-based dropdown interface
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Four variants: default, error, success, warning
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Dark mode support with theme-aware colors
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Programmatic control via ref (open/close)
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">• Disabled state support</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Customizable modal title and styling
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Configurable item alignment (left/center)
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Smooth animations and transitions
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Accessible with proper touch targets
								</Text>
								<Text className="mb-2 text-slate-700 dark:text-slate-300">
									• TypeScript support with full type safety
								</Text>
							</View>
						</View>
					</View>

					{/* Divider */}
					<View className="mb-8 h-px bg-slate-200 dark:bg-slate-700" />

					{/* Alert Component Section */}
					<View className="mb-8">
						<Text className="mb-4 text-3xl font-bold">Alert Component</Text>
						<Text className="mb-4 text-slate-700 dark:text-slate-300">
							Alert component with both inline and toast modes. Inline alerts are persistent and
							perfect for form validation, while toast alerts auto-dismiss with smooth animations.
						</Text>

						{/* Inline Alerts */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Inline Alerts</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Static alerts that are always visible. Perfect for form validation errors and
								success messages. These alerts are not closable and remain persistent.
							</Text>

							{/* Success Alert */}
							<Alert
								variant="success"
								mode="inline"
								title="Success!"
								message="Your action was completed successfully. All changes have been saved."
								showIcon={true}
								className="mb-4"
							/>

							{/* Error Alert */}
							<Alert
								variant="error"
								mode="inline"
								title="Error occurred"
								message="Something went wrong while processing your request. Please try again."
								showIcon={true}
								className="mb-4"
							/>

							{/* Warning Alert */}
							<Alert
								variant="warning"
								mode="inline"
								title="Warning"
								message="Please review your information before proceeding. Some fields may be incomplete."
								showIcon={true}
								className="mb-4"
							/>

							{/* Info Alert */}
							<Alert
								variant="info"
								mode="inline"
								title="Information"
								message="Here's some helpful information about the current process and what to expect next."
								showIcon={true}
								className="mb-4"
							/>

							{/* Alert without icon */}
							<Alert
								variant="info"
								mode="inline"
								title="No Icon Alert"
								message="This alert has no icon (showIcon={false}). Useful when you want a cleaner look."
								showIcon={false}
								className="mb-4"
							/>

							{/* Alert without title */}
							<Alert
								variant="success"
								mode="inline"
								message="This alert has no title, just a message. Perfect for simple notifications."
								showIcon={true}
								className="mb-4"
							/>
						</View>

						{/* Toast Alerts */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Toast Alerts</Text>
							<Text className="mb-4 text-slate-700 dark:text-slate-300">
								Single toast notifications with smooth slide-in animations. Only one toast can be
								shown at a time. Smart auto-dismiss based on message length, with manual control
								available.
							</Text>

							<View className="gap-2">
								<View className="flex-row gap-2">
									<Button onPress={showSuccessToast} className="flex-1">
										Success
									</Button>
									<Button onPress={showErrorToast} className="flex-1">
										Error (5s)
									</Button>
								</View>
								<View className="flex-row gap-2">
									<Button onPress={showWarningToast} className="flex-1">
										Warning (Manual)
									</Button>
									<Button onPress={showInfoToast} className="flex-1">
										Info
									</Button>
								</View>
								<Button onPress={showSimpleToast} className="w-full">
									Simple (Auto)
								</Button>
							</View>
						</View>

						{/* Features */}
						<View className="mb-6">
							<Text className="mb-3 text-2xl font-semibold">Key Features</Text>
							<View className="gap-2">
								<Text className="text-slate-700 dark:text-slate-300">
									• Four variants: success, error, warning, info
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Two modes: inline (persistent) and toast (with close button)
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Smooth animations with react-native-reanimated
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Optional icons: showIcon={true} for default, showIcon={false} for none
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Smart dismiss: &quot;auto&quot; (message-based), &quot;manual&quot; (forever),
									&quot;3s&quot; (custom)
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">• Dark mode support</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Accessible close button (44px minimum)
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Single toast system (no stacking complexity)
								</Text>
								<Text className="text-slate-700 dark:text-slate-300">
									• Route-aware cleanup (auto-dismiss on navigation)
								</Text>
								<Text className="mb-2 text-slate-700 dark:text-slate-300">
									• Unicode-safe character counting for smart timing
								</Text>
							</View>
						</View>
					</View>
				</View>
			</ScrollView>
		</>
	)
}
