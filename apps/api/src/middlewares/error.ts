import { ZodError } from "zod"

import type { ErrorHandler, NotFoundHandler } from "hono"

import { isDev } from "@/utils/env"
import { res } from "@/utils/response"

export const errorHandler: ErrorHandler = (err, c) => {
	// Handle Zod validation errors (already handled by validator middleware)
	// This is still needed for non-middleware Zod errors
	if (err instanceof ZodError) {
		return res.validationError(c, err.issues)
	}

	// Handle database constraint violations with proper error type checking
	if (err instanceof Error && err.message.includes("duplicate key")) {
		return res.conflict(c, "Resource already exists")
	}

	// Handle database connection errors with proper error type checking
	if (
		err instanceof Error &&
		(err.message.includes("connection") || err.message.includes("timeout"))
	) {
		return res.serviceUnavailable(c, "Database temporarily unavailable")
	}

	// Log unexpected errors for debugging
	console.error("Unexpected error:", {
		name: err.name,
		message: err.message,
		stack: err.stack,
		url: c.req.url,
		method: c.req.method,
	})

	// Return generic error in production, detailed in development
	if (isDev(c)) {
		return res.internalError(c, `Internal error: ${err.message}`)
	}

	return res.internalError(c)
}

export const notFoundHandler: NotFoundHandler = (c) => {
	return res.notFound(c)
}
