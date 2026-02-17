import { forwardRef, memo, useMemo } from "react"

import { cn } from "@prism/utils/expo"

import { TextInput as RNTextInput, type TextInputProps as RNTextInputProps } from "react-native"

import { textInputBase, type TextInputVariant, textInputVariants } from "../theme"

export interface TextInputProps extends Omit<RNTextInputProps, "style"> {
	variant?: TextInputVariant
	className?: string
}

export const TextInput = memo(
	forwardRef<RNTextInput, TextInputProps>(
		({ variant = "default", className = "", ...props }, ref) => {
			const allClasses = useMemo(
				() => cn(textInputBase, textInputVariants[variant], className),
				[variant, className],
			)

			return (
				<RNTextInput
					ref={ref}
					className={allClasses}
					autoCorrect={false}
					spellCheck={false}
					{...props}
				/>
			)
		},
	),
)

TextInput.displayName = "TextInput"
