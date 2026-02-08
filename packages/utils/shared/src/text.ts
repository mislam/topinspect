/**
 * Text utility functions for handling Unicode-safe operations
 */

/**
 * Get the Unicode-safe character count of a string
 * Handles multi-byte characters (like Bangla, emojis) correctly
 *
 * @param text - The text to count characters for
 * @returns The actual character count (not byte count)
 *
 * @example
 * getUnicodeLength("Hello") // 5
 * getUnicodeLength("হ্যালো") // 5 (Bangla characters)
 * getUnicodeLength("Hello 👋") // 7 (emoji counts as 1)
 */
export const getUnicodeLength = (text: string): number => {
	return Array.from(text).length
}

/**
 * Calculate reading time based on character count
 * Uses a base time plus character-based reading speed
 *
 * @param text - The text to calculate reading time for
 * @param baseTime - Base time in milliseconds (default: 1000ms)
 * @param charTime - Time per character in milliseconds (default: 100ms)
 * @returns Reading time in milliseconds, clamped between 2-10 seconds
 *
 * @example
 * calculateReadingTime("Hello") // ~1250ms
 * calculateReadingTime("This is a longer message") // ~2250ms
 * calculateReadingTime("হ্যালো") // ~1250ms (same as English)
 */
export const calculateReadingTime = (text: string, baseTime = 1000, charTime = 100): number => {
	const charCount = getUnicodeLength(text)
	const calculatedTime = baseTime + charCount * charTime

	// Clamp between 2-10 seconds for reasonable UX
	return Math.min(Math.max(calculatedTime, 2000), 10000)
}

/**
 * Capitalize the first letter of a string
 * Simple utility for capitalizing single words or the start of a string
 *
 * @param text - The text to capitalize
 * @returns Text with first letter capitalized, rest unchanged
 *
 * @example
 * capitalizeFirst("hello") // "Hello"
 */
export const capitalizeFirst = (text: string): string => {
	if (!text) return text
	return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Capitalize the first letter of each word in text
 * Handles both English and Bangla text properly
 * Preserves existing capitalization for non-Latin scripts
 *
 * @param text - The text to capitalize
 * @returns Text with first letter of each word capitalized
 *
 * @example
 * capitalizeWords("john doe") // "John Doe"
 * capitalizeWords("আবুল কালাম") // "আবুল কালাম" (Bangla - no change needed)
 * capitalizeWords("john আবুল") // "John আবুল" (Mixed - only English parts capitalized)
 * capitalizeWords("company name") // "Company Name"
 * capitalizeWords("street address") // "Street Address"
 */
export const capitalizeWords = (text: string): string => {
	// Split by whitespace and process each word
	return text
		.split(/\s+/)
		.map((word) => {
			if (!word) return word

			// Check if the word contains Latin characters
			const hasLatinChars = /[a-zA-Z]/.test(word)

			if (hasLatinChars) {
				// Only capitalize if it contains Latin characters
				// This preserves Bangla, Arabic, etc. as-is
				return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			}

			// Return non-Latin words as-is (Bangla, Arabic, etc.)
			return word
		})
		.join(" ")
}

/**
 * Returns the correct article ("a" or "an") based on the first letter of the word
 *
 * @param word - The word to determine the article for
 * @returns "a" or "an"
 *
 * @example
 * getArticle("apple") // "an"
 * getArticle("banana") // "a"
 */
export const getArticle = (word: string): string => {
	if (!word) return "a"
	const firstLetter = word.charAt(0).toLowerCase()
	return ["a", "e", "i", "o", "u"].includes(firstLetter) ? "an" : "a"
}

/**
 * Parse duration string to milliseconds
 * Supports various formats: "3s", "500ms", "1.5s"
 *
 * @param duration - Duration string or number
 * @returns Duration in milliseconds
 *
 * @example
 * parseDuration("3s") // 3000
 * parseDuration("500ms") // 500
 * parseDuration("1.5s") // 1500
 * parseDuration(5000) // 5000
 */
export const parseDuration = (duration: string | number): number => {
	if (typeof duration === "number") {
		return duration
	}

	const match = duration.match(/^(\d+(?:\.\d+)?)(s|ms)$/)
	if (!match) {
		throw new Error(`Invalid duration format: ${duration}. Use format like "3s" or "500ms"`)
	}

	const value = parseFloat(match[1])
	const unit = match[2]

	return unit === "s" ? value * 1000 : value
}
