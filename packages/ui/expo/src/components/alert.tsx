import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from "react"

import { cn } from "@prism/utils/expo"
import { calculateReadingTime, parseDuration } from "@prism/utils/shared"
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { TouchableOpacity, View, type ViewProps } from "react-native"

import { colors } from "../colors"
import { alertBase, type AlertVariant, alertVariants } from "../theme"

import { Icon } from "./icon"
import { Text } from "./text"

// Simple toast state
let toastState: {
	variant: AlertVariant
	title?: string
	message: string
	showIcon: boolean
	dismiss?: "manual" | "auto" | string | number
} | null = null

let setToastState: ((toast: typeof toastState) => void) | null = null

// Export convenience functions
export const showToast = (props: {
	variant?: AlertVariant
	title?: string
	message: string
	showIcon?: boolean
	dismiss?: "manual" | "auto" | string | number
}) => {
	// We use setTimeout as a workaround to avoid the toast not being shown in some cases
	// (e.g. when the toast is shown after a navigation)
	setTimeout(() => {
		toastState = {
			variant: props.variant || "info",
			title: props.title,
			message: props.message,
			showIcon: props.showIcon !== false,
			dismiss: props.dismiss || "auto",
		}
		setToastState?.(toastState)
	})
}

export const hideToast = (force = false) => {
	// If force is true, always hide
	// If force is false, only hide if toast is not manual
	if (force || !toastState || toastState.dismiss !== "manual") {
		toastState = null
		setToastState?.(null)
	}
}

export interface AlertProps extends ViewProps {
	variant?: AlertVariant
	mode?: "inline" | "toast"
	title?: string
	message: string
	showIcon?: boolean
	dismiss?: "manual" | "auto" | string | number
	className?: string
}

const AlertComponent = memo(
	forwardRef<View, AlertProps>(
		(
			{
				variant = "info",
				mode = "inline",
				title,
				message,
				showIcon = true,
				dismiss = "auto",
				className = "",
				...props
			},
			ref,
		) => {
			// Safe area insets for proper toast positioning
			const insets = useSafeAreaInsets()

			// Animation values for toast mode
			const translateY = useSharedValue(mode === "toast" ? -100 : 0)
			const opacity = useSharedValue(mode === "toast" ? 0 : 1)
			const scale = useSharedValue(mode === "toast" ? 0.95 : 1)

			// Memoized classes
			const containerClasses = useMemo(
				() => cn(alertBase.container, alertVariants[variant].container, className),
				[variant, className],
			)

			const textClasses = useMemo(() => cn(alertBase.text, alertVariants[variant].text), [variant])

			const handleClose = useCallback(() => {
				translateY.value = withTiming(-100, { duration: 250 })
				opacity.value = withTiming(0, { duration: 250 })
				scale.value = withTiming(0.95, { duration: 250 })
				setTimeout(() => hideToast(true), 250) // Force hide when user manually closes
			}, [translateY, opacity, scale])

			// Auto-dismiss for toast mode
			useEffect(() => {
				if (mode === "toast" && dismiss !== "manual") {
					const duration =
						dismiss === "auto"
							? calculateReadingTime(message)
							: typeof dismiss === "string"
								? parseDuration(dismiss)
								: typeof dismiss === "number"
									? dismiss
									: calculateReadingTime(message)

					const timer = setTimeout(handleClose, duration)
					return () => clearTimeout(timer)
				}
			}, [mode, dismiss, message, handleClose])

			// Show animation for toast mode
			useEffect(() => {
				if (mode === "toast") {
					translateY.value = withSpring(0, { damping: 22, stiffness: 400 })
					opacity.value = withTiming(1, { duration: 150 })
					scale.value = withSpring(1, { damping: 22, stiffness: 400 })
				}
			}, [mode, translateY, opacity, scale])

			// Animated styles for toast mode
			const animatedStyle = useAnimatedStyle(() => {
				if (mode === "inline") return {}

				return {
					transform: [{ translateY: translateY.value }, { scale: scale.value }],
					opacity: opacity.value,
				}
			})

			// Icon logic
			const alertIcon = useMemo(() => {
				if (!showIcon) return null

				const iconMap = {
					success: "checkmark-circle" as const,
					error: "close-circle" as const,
					warning: "warning" as const,
					info: "information-circle" as const,
				}

				const colorMap = {
					success: { light: colors.green[600], dark: colors.green[400] },
					error: { light: colors.red[600], dark: colors.red[400] },
					warning: { light: colors.yellow[600], dark: colors.yellow[400] },
					info: { light: colors.blue[600], dark: colors.blue[400] },
				}

				return (
					<Icon
						name={iconMap[variant]}
						size={20}
						lightColor={colorMap[variant].light}
						darkColor={colorMap[variant].dark}
					/>
				)
			}, [showIcon, variant])

			// Toast positioning with safe area insets
			const toastStyle =
				mode === "toast"
					? {
							position: "absolute" as const,
							top: 16 + insets.top,
							left: 16,
							right: 16,
							zIndex: 1000,
						}
					: {}

			return (
				<Animated.View
					ref={ref}
					style={[animatedStyle, toastStyle]}
					className={containerClasses}
					{...props}
				>
					{/* Icon */}
					{alertIcon && <View className="mr-2 mt-0.5">{alertIcon}</View>}

					{/* Content */}
					<View className="flex-1">
						{title && <Text className={cn(textClasses, "mb-1.5 font-semibold")}>{title}</Text>}
						<Text className={textClasses}>{message}</Text>
					</View>

					{/* Close button for toast mode */}
					{mode === "toast" && (
						<TouchableOpacity
							className="-m-3 h-12 w-12 items-center justify-center opacity-70"
							onPress={handleClose}
							activeOpacity={0.8}
						>
							<Icon
								name="close"
								size={20}
								lightColor={colors.slate[800]}
								darkColor={colors.slate[200]}
							/>
						</TouchableOpacity>
					)}
				</Animated.View>
			)
		},
	),
)

AlertComponent.displayName = "Alert"

// Create a proper type for Alert with static methods
interface AlertComponentWithMethods extends React.NamedExoticComponent<AlertProps> {
	toast: typeof showToast
	hide: typeof hideToast
}

// Add static methods to the Alert component
const Alert = AlertComponent as AlertComponentWithMethods
Alert.toast = showToast
Alert.hide = hideToast

// Export the enhanced Alert component
export { Alert }

// Simple Toast Container
export const Toast = () => {
	const [toast, setToast] = useState<typeof toastState>(null)

	useEffect(() => {
		setToastState = setToast
		return () => {
			setToastState = null
		}
	}, [])

	if (!toast) return null

	return (
		<Alert
			mode="toast"
			variant={toast.variant}
			title={toast.title}
			message={toast.message}
			showIcon={toast.showIcon}
			dismiss={toast.dismiss}
		/>
	)
}
