// Simple logging utility for the app

// Internal utility function to safely extract error messages
const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message
	}
	if (typeof error === "string") {
		return error
	}
	if (typeof error === "number") {
		return `Error ${error}`
	}
	if (error && typeof error === "object" && "message" in error) {
		return String((error as { message: unknown }).message)
	}
	return String(error)
}

// Helper function to format log details with automatic error handling
const formatDetails = (details?: Record<string, unknown>): Record<string, unknown> => {
	if (!details) return {}

	const formatted: Record<string, unknown> = {}
	for (const [key, value] of Object.entries(details)) {
		if (key === "error" && value !== undefined) {
			formatted[key] = getErrorMessage(value)
		} else {
			formatted[key] = value
		}
	}
	return formatted
}

/**
 * Logger class with automatic error formatting
 *
 * Usage Standards:
 * 1. For error objects: { error } - Logger automatically formats
 * 2. For error metadata: { errorCode, field, etc. } - Pass through as-is
 * 3. For mixed context: { error, url, method, etc. } - Error auto-formatted, rest passed through
 *
 * Examples:
 * - logger.warn("Operation failed", { error })                   // Error auto-formatted
 * - logger.debug("Validation failed", { field: "email" })        // Metadata only
 * - logger.error("Request failed", { error, url: "/api" })       // Mixed context
 */
class Logger {
	debug(message: string, details?: Record<string, unknown>) {
		if (__DEV__) {
			if (details && Object.keys(details).length > 0) {
				console.debug(message, formatDetails(details))
			} else {
				console.debug(message)
			}
		}
		// In production, do nothing
	}

	warn(message: string, details?: Record<string, unknown>) {
		if (__DEV__) {
			if (details && Object.keys(details).length > 0) {
				console.warn(message, formatDetails(details))
			} else {
				console.warn(message)
			}
		}
		// In production, decide whether to send to Sentry
	}

	error(message: string, details?: Record<string, unknown>) {
		if (details && Object.keys(details).length > 0) {
			console.error(message, formatDetails(details))
		} else {
			console.error(message)
		}
		// In production, always send to Sentry
	}

	// Public method to format errors for external use
	formatError(error: unknown): string {
		return getErrorMessage(error)
	}
}

// Export singleton instance
export const logger = new Logger()
