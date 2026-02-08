import { type ComponentRef, forwardRef, memo, useMemo } from "react"

import { cn } from "@the/utils/expo"

import { TouchableOpacity, type TouchableOpacityProps } from "react-native"

import { colors } from "../colors"

import { Icon } from "./icon"

export interface BackButtonProps extends Omit<TouchableOpacityProps, "style"> {
	/**
	 * Custom text for the back button (default: "Back")
	 */
	text?: string
	/**
	 * Additional className for the container
	 */
	className?: string
}

export const BackButton = memo(
	forwardRef<ComponentRef<typeof TouchableOpacity>, BackButtonProps>(
		({ className = "", activeOpacity = 0.8, ...props }, ref) => {
			// All classes resolved at build time with memoization
			const containerClasses = useMemo(
				() => cn("h-12 w-12 flex-row items-center -ml-1.5", className),
				[className],
			)

			return (
				<TouchableOpacity
					ref={ref}
					className={containerClasses}
					activeOpacity={activeOpacity}
					{...props}
				>
					<Icon
						name="chevron-back"
						size={24}
						lightColor={colors.slate[800]}
						darkColor={colors.slate[200]}
					/>
				</TouchableOpacity>
			)
		},
	),
)

BackButton.displayName = "BackButton"
