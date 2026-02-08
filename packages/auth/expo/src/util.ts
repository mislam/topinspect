import { type ErrorResponse, UNKNOWN_ERROR } from "@the/types"
import { logger } from "@the/utils/expo"

import { useAuthStore } from "./store"

// Helper function to set error state and throw error
// Preserves ErrorResponse structure so components can access code and error fields
export const setErrorState = (error: unknown): ErrorResponse & Error => {
	const errorMessage =
		typeof error === "string"
			? error
			: ((error as ErrorResponse).error ?? (error as Error).message ?? UNKNOWN_ERROR.error)
	const errorCode = (error as ErrorResponse).code ?? UNKNOWN_ERROR.code

	useAuthStore.setState({
		error: errorMessage,
		isLoading: false,
	})

	// Log error
	logger.debug(`${errorCode}: ${errorMessage}`)

	// Create error object that preserves both ErrorResponse structure and Error interface
	const err = new Error(errorMessage) as ErrorResponse & Error
	err.code = errorCode
	err.error = errorMessage
	return err
}
