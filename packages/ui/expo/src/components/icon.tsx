/**
 * Icon component that supports Ionicons with optimized performance
 * For custom SVG icons, use the separate <Svg> component
 *
 * @param name - The name of the Ionicons icon (e.g. "person", "settings")
 * @param size - The size of the icon
 * @param variant - The icon variant to use for theming (fallback when no custom colors)
 * @param color - The color of the icon (overrides theme and custom colors)
 * @param lightColor - Custom light mode color (optional)
 * @param darkColor - Custom dark mode color (optional)
 * @param props - Additional props to pass to the icon component
 */

import { type ComponentRef, forwardRef, memo, useMemo } from "react"

import { Ionicons } from "@expo/vector-icons"

import { useColorScheme } from "react-native"

import { type IconVariant, iconVariants } from "../theme"

export type IconName = keyof typeof Ionicons.glyphMap

export interface IconProps {
	name: IconName
	size?: number
	variant?: IconVariant
	color?: string
	lightColor?: string
	darkColor?: string
}

export const Icon = memo(
	forwardRef<ComponentRef<typeof Ionicons>, IconProps>(
		({ name, size = 24, variant = "default", color, lightColor, darkColor, ...props }, ref) => {
			const isDark = useColorScheme() === "dark"

			// Memoized color resolution for optimal performance
			const resolvedColor = useMemo(() => {
				// Priority 1: Explicit color (highest priority)
				if (color) {
					return color
				}

				// Priority 2: Custom light/dark colors
				if (lightColor && darkColor) {
					return isDark ? darkColor : lightColor
				}

				// Priority 3: Theme variant (fallback when no custom colors)
				const themeColors = iconVariants[variant]
				return isDark ? themeColors.dark : themeColors.light
			}, [color, lightColor, darkColor, variant, isDark])

			return <Ionicons ref={ref} name={name} size={size} color={resolvedColor} {...props} />
		},
	),
)

Icon.displayName = "Icon"
