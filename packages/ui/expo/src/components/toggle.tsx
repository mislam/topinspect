import { type ComponentRef, forwardRef, memo, useEffect, useMemo, useRef } from "react"

import { cn } from "@the/utils/expo"

import { Animated, TouchableOpacity, type TouchableOpacityProps } from "react-native"

import * as Haptics from "expo-haptics"

import { toggleStyles } from "../theme"

type ToggleSize = "sm" | "md" | "lg"

export interface ToggleProps extends Omit<TouchableOpacityProps, "style"> {
	value: boolean
	onValueChange: (value: boolean) => void
	disabled?: boolean
	size?: ToggleSize
	className?: string
}

// Toggle sizes with Tailwind classes and pixel values
const toggleSizes = {
	sm: {
		container: "w-10 h-6",
		thumb: "w-4 h-4",
		containerWidth: 40,
		thumbSize: 16,
	},
	md: {
		container: "w-12 h-7",
		thumb: "w-5 h-5",
		containerWidth: 48,
		thumbSize: 20,
	},
	lg: {
		container: "w-14 h-8",
		thumb: "w-6 h-6",
		containerWidth: 56,
		thumbSize: 24,
	},
}

export const Toggle = memo(
	forwardRef<ComponentRef<typeof TouchableOpacity>, ToggleProps>(
		({ value, onValueChange, disabled = false, size = "md", className = "", ...props }, ref) => {
			const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current

			// Animate when value changes
			useEffect(() => {
				Animated.timing(animatedValue, {
					toValue: value ? 1 : 0,
					duration: 200,
					useNativeDriver: false,
				}).start()
			}, [value, animatedValue])

			const handlePress = () => {
				if (!disabled) {
					// Haptic feedback for better UX
					Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
					onValueChange(!value)
				}
			}

			// Memoized classes for performance
			const containerClasses = useMemo(
				() =>
					cn(
						"rounded-full", // Basic container style
						toggleSizes[size].container,
						disabled ? toggleStyles.disabled : value ? toggleStyles.on : toggleStyles.off,
						disabled ? "opacity-50" : "",
						className,
					),
				[size, value, disabled, className],
			)

			const thumbClasses = useMemo(
				() => cn("rounded-full shadow-sm bg-white", toggleSizes[size].thumb),
				[size],
			)

			// Calculate thumb position based on size
			const thumbPosition = useMemo(() => {
				const { containerWidth, thumbSize } = toggleSizes[size]
				const padding = 4 // 4px padding on each side
				const maxTranslateX = containerWidth - thumbSize - padding

				return animatedValue.interpolate({
					inputRange: [0, 1],
					outputRange: [padding, maxTranslateX],
				})
			}, [animatedValue, size])

			return (
				<TouchableOpacity
					ref={ref}
					onPress={handlePress}
					disabled={disabled}
					className={className}
					activeOpacity={1}
					{...props}
				>
					<Animated.View
						className={containerClasses}
						style={{
							justifyContent: "center", // Center the thumb vertically
							alignItems: "flex-start", // Start from left, animation handles horizontal position
						}}
					>
						<Animated.View
							className={thumbClasses}
							style={{
								transform: [{ translateX: thumbPosition }],
							}}
						/>
					</Animated.View>
				</TouchableOpacity>
			)
		},
	),
)

Toggle.displayName = "Toggle"
