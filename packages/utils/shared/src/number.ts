/**
 * Format numbers using Indian/Bangladeshi numbering system (1,23,456)
 * This is the standard format used in Bangladesh and India
 *
 * @param num - The number to format
 * @param options - Formatting options
 * @param options.decimals - Number of decimal places (default: 0 for integers)
 * @returns Formatted number string
 *
 * @example
 * formatNumber(123456)                    // "1,23,456"
 * formatNumber(123456, { decimals: 0 })   // "1,23,456"
 * formatNumber(123456.50, { decimals: 2 }) // "1,23,456.50"
 * formatNumber(123456.7, { decimals: 1 })  // "1,23,456.7"
 */
export const formatNumber = (num: number, options?: { decimals?: number }): string => {
	const decimalPlaces = options?.decimals ?? 0

	return new Intl.NumberFormat("en-IN", {
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces,
	}).format(num)
}
