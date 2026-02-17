import { forwardRef, memo, useMemo } from "react"

import { cn } from "@prism/utils/expo"

import { Text as RNText, type TextProps as RNTextProps } from "react-native"

import { textBase, type TextVariant, textVariants } from "../theme"

export interface TextProps extends Omit<RNTextProps, "style"> {
	/**
	 * Text variant determines the color and styling
	 * - `default`: Primary text color (slate-800/200)
	 * - `secondary`: Secondary text color (slate-600/400)
	 * - `link`: Link text color (indigo-600/500) - use with onPress for clickable links
	 * - `error`: Error text color (red-600/500)
	 */
	variant?: TextVariant
	className?: string
}

export const Text = memo(
	forwardRef<RNText, TextProps>(
		({ variant = "default", className = "", children, ...props }, ref) => {
			const allClasses = useMemo(
				() => cn(textBase, textVariants[variant], className),
				[variant, className],
			)

			return (
				<RNText ref={ref} className={allClasses} {...props}>
					{children}
				</RNText>
			)
		},
	),
)

Text.displayName = "Text"
