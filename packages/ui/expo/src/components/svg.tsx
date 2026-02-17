/**
 * Reusable SVG component for custom SVG icons
 * Apps can register their own SVG assets using the registerSvgAssets function
 *
 * @param name - The name of the SVG icon (must be registered by the app)
 * @param width - The width of the icon (default: 24)
 * @param height - The height of the icon (default: width value for square icons)
 * @param variant - The icon variant to use for theming (fallback when no custom colors)
 * @param color - The color of the icon (overrides theme and custom colors)
 * @param lightColor - Custom light mode color (optional)
 * @param darkColor - Custom dark mode color (optional)
 * @param props - Additional props to pass to the SVG component
 */

import { type ComponentRef, forwardRef, memo, useMemo } from "react"

import { logger } from "@prism/utils/expo"

import { useColorScheme } from "react-native"

import { type SvgVariant, svgVariants } from "../theme"

// Global SVG registry - apps can register their assets here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let svgRegistry: Record<string, React.ComponentType<any>> = {}

// Type for registered SVG names
export type SvgName = string

export interface SvgProps {
	name: SvgName
	width?: number
	height?: number
	variant?: SvgVariant
	color?: string
	lightColor?: string
	darkColor?: string
}

/**
 * Register SVG assets for the app
 * Call this function in your app's entry point to register your SVG assets
 *
 * @param assets - Object mapping SVG names to their React components
 *
 * @example
 * ```tsx
 * import { registerSvgAssets } from "@prism/ui/expo"
 * import logo from "./assets/logo.svg"
 * import icon from "./assets/icon.svg"
 *
 * registerSvgAssets({
 *   logo,
 *   icon,
 * })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerSvgAssets(assets: Record<string, React.ComponentType<any>>) {
	svgRegistry = { ...svgRegistry, ...assets }
	// logger.debug(
	// 	`Registered ${Object.keys(assets).length} SVG assets [${Object.keys(assets).join(", ")}]`,
	// )
}

/**
 * Get all registered SVG names
 * Useful for debugging or validation
 */
export function getRegisteredSvgNames(): string[] {
	return Object.keys(svgRegistry)
}

export const Svg = memo(
	forwardRef<ComponentRef<"svg">, SvgProps>(
		(
			{
				name,
				width = 24,
				height = 24,
				variant = "default",
				color,
				lightColor,
				darkColor,
				...props
			},
			_ref,
		) => {
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
				const themeColors = svgVariants[variant]
				return isDark ? themeColors.dark : themeColors.light
			}, [color, lightColor, darkColor, variant, isDark])

			const SvgComponent = svgRegistry[name]

			// Safety check - if component doesn't exist or is invalid, return null
			if (!SvgComponent || typeof SvgComponent !== "function") {
				logger.warn(
					`SVG icon "${name}" not found. Available icons: ${Object.keys(svgRegistry).join(", ")}`,
				)
				return null
			}

			try {
				return <SvgComponent width={width} height={height} color={resolvedColor} {...props} />
			} catch (error) {
				logger.warn(`Error rendering SVG icon "${name}"`, { error })
				return null
			}
		},
	),
)

Svg.displayName = "Svg"
