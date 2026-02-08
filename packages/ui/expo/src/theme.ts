/**
 * Centralized theme configuration for all UI components
 */

import { colors } from "./colors"

const theme = {
	text: {
		base: "text-base",
		variants: {
			default: "text-slate-800 dark:text-slate-200",
			primary: "text-indigo-600 dark:text-indigo-500",
			secondary: "text-slate-600 dark:text-slate-400",
			error: "text-red-600 dark:text-red-500",
		},
	},
	button: {
		base: {
			container: "h-12 px-4 flex-row items-center justify-center rounded-full border",
			text: "text-center text-base font-semibold",
		},
		variants: {
			default: {
				container:
					"bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 disabled:bg-slate-200 disabled:border-slate-200 dark:disabled:bg-slate-700 dark:disabled:border-slate-700",
				text: "text-white disabled:text-slate-400 dark:disabled:text-slate-500",
			},
			outline: {
				container:
					"bg-transparent border-slate-400 dark:border-slate-500 disabled:border-slate-200 dark:disabled:border-slate-700",
				text: "text-slate-800 dark:text-slate-200 disabled:text-slate-200 dark:disabled:text-slate-700",
			},
			danger: {
				container:
					"bg-red-600 dark:bg-red-500 border-red-600 dark:border-red-500 disabled:bg-slate-200 disabled:border-slate-200 dark:disabled:bg-slate-700 dark:disabled:border-slate-700",
				text: "text-white disabled:text-slate-400 dark:disabled:text-slate-500",
			},
		},
	},
	textInput: {
		base: "py-[13px] px-3 text-base leading-5 rounded-lg border bg-white dark:bg-slate-900 placeholder:text-slate-400 dark:placeholder:text-slate-500",
		variants: {
			default: "border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-200",
			error: "border-red-600 dark:border-red-500 text-red-600 dark:text-red-500",
			success: "border-green-600 dark:border-green-500 text-green-600 dark:text-green-500",
			warning: "border-yellow-600 dark:border-yellow-500 text-yellow-600 dark:text-yellow-500",
		},
	},
	otpInput: {
		base: "w-12 h-16 py-4 text-3xl leading-none text-center font-semibold rounded-lg border-2 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900",
		variants: {
			default: "border-slate-400 dark:border-slate-500",
			error: "border-red-600 dark:border-red-500",
			success: "border-green-600 dark:border-green-500",
		},
	},
	icon: {
		variants: {
			default: {
				light: colors.slate[800],
				dark: colors.slate[200],
			},
		},
	},
	svg: {
		variants: {
			default: {
				light: colors.slate[800],
				dark: colors.slate[200],
			},
		},
	},
	alert: {
		base: {
			container: "flex-row items-start p-3 rounded-lg border",
			text: "text-base leading-snug",
		},
		variants: {
			success: {
				container: "bg-green-100 dark:bg-[#102C2E] border-green-300 dark:border-green-900",
				text: "text-green-900 dark:text-green-200",
			},
			error: {
				container: "bg-red-100 dark:bg-[#311827] border-red-300 dark:border-red-900",
				text: "text-red-900 dark:text-red-200",
			},
			warning: {
				container: "bg-yellow-100 dark:bg-[#302323] border-yellow-300 dark:border-yellow-900",
				text: "text-yellow-900 dark:text-yellow-200",
			},
			info: {
				container: "bg-blue-100 dark:bg-[#12224D] border-blue-300 dark:border-blue-900",
				text: "text-blue-900 dark:text-blue-200",
			},
		},
	},
	picker: {
		base: {
			container:
				"h-12 px-3 flex-row items-center justify-between rounded-lg border bg-white dark:bg-slate-900",
			text: "text-base text-slate-800 dark:text-slate-200",
			placeholder: "text-slate-400 dark:text-slate-500",
			icon: "text-slate-400 dark:text-slate-500",
		},
		variants: {
			default: "border-slate-400 dark:border-slate-500",
			error: "border-red-600 dark:border-red-500",
			success: "border-green-600 dark:border-green-500",
			warning: "border-yellow-600 dark:border-yellow-500",
		},
		modal: {
			container: "bg-white dark:bg-slate-900 rounded-t-2xl flex-col",
			header:
				"flex-row items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700",
			title: "text-lg font-medium text-slate-800 dark:text-slate-200",
			item: "px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-row items-center",
			itemText: "text-base text-slate-800 dark:text-slate-200",
			itemSelected: "bg-indigo-200/50 dark:bg-indigo-900/50",
		},
	},
	toggle: {
		on: "bg-indigo-500",
		off: "bg-slate-300 dark:bg-slate-600",
		disabled: "bg-slate-300 dark:bg-slate-700",
	},
}

export const textBase = theme.text.base
export const textVariants = theme.text.variants
export type TextVariant = keyof typeof textVariants

export const buttonBase = theme.button.base
export const buttonVariants = theme.button.variants
export type ButtonVariant = keyof typeof buttonVariants

export const textInputBase = theme.textInput.base
export const textInputVariants = theme.textInput.variants
export type TextInputVariant = keyof typeof textInputVariants

export const otpInputBase = theme.otpInput.base
export const otpInputVariants = theme.otpInput.variants
export type OtpInputVariant = keyof typeof otpInputVariants

export const iconVariants = theme.icon.variants
export type IconVariant = keyof typeof iconVariants

export const svgVariants = theme.svg.variants
export type SvgVariant = keyof typeof svgVariants

export const alertBase = theme.alert.base
export const alertVariants = theme.alert.variants
export type AlertVariant = keyof typeof alertVariants

export const pickerBase = theme.picker.base
export const pickerVariants = theme.picker.variants
export const pickerModal = theme.picker.modal
export type PickerVariant = keyof typeof pickerVariants

export const toggleStyles = theme.toggle
