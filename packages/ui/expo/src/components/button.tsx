import { type ComponentRef, forwardRef, memo, type ReactNode, useMemo } from "react"

import { cn } from "@the/utils/expo"

import { TouchableOpacity, type TouchableOpacityProps } from "react-native"

import { buttonBase, type ButtonVariant, buttonVariants } from "../theme"

import { Text } from "./text"

export interface ButtonProps extends Omit<TouchableOpacityProps, "style"> {
	variant?: ButtonVariant
	disabled?: boolean
	children: ReactNode
	className?: string
}

export const Button = memo(
	forwardRef<ComponentRef<typeof TouchableOpacity>, ButtonProps>(
		({ variant = "default", disabled = false, children, className = "", ...props }, ref) => {
			// All classes resolved at build time with memoization
			const allClasses = useMemo(
				() => cn(buttonBase.container, buttonVariants[variant].container, className),
				[variant, className],
			)
			const textClasses = useMemo(
				() => cn(buttonBase.text, buttonVariants[variant].text),
				[variant],
			)

			// Auto-wrap string/number children in Text for convenience
			// Allow custom children (Text, icons, etc.) to pass through for flexibility
			const content = useMemo(() => {
				if (typeof children === "string" || typeof children === "number") {
					return (
						<Text className={textClasses} disabled={disabled}>
							{children}
						</Text>
					)
				}
				return children
			}, [children, textClasses, disabled])

			return (
				<TouchableOpacity
					ref={ref}
					className={allClasses}
					disabled={disabled}
					activeOpacity={disabled ? 1 : 0.8}
					{...props}
				>
					{content}
				</TouchableOpacity>
			)
		},
	),
)

Button.displayName = "Button"
