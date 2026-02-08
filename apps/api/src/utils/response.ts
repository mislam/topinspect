import type { ErrorResponse } from "@the/types"
import type { Context } from "hono"
import type { ContentfulStatusCode, StatusCode } from "hono/utils/http-status"

interface PaginationMeta {
	page: number
	limit: number
	total: number
	totalPages: number
}

interface ResponseOptions {
	status?: ContentfulStatusCode
	meta?: Record<string, unknown>
}

// Response utilities for consistent API responses.
export const res = {
	ok: <T extends object>(c: Context, data: T, options: ResponseOptions = {}) => {
		const response: T & { meta?: Record<string, unknown> } = {
			...data,
			...(options.meta ? { meta: options.meta } : {}),
		}
		return c.json(response, options.status ?? 200)
	},

	created: <T extends object>(c: Context, data: T) => res.ok(c, data, { status: 201 }),

	noContent: (c: Context) => c.body(null, 204 as StatusCode),

	paginated: <T extends object>(
		c: Context,
		data: T[],
		pagination: PaginationMeta,
		options: ResponseOptions = {},
	) => {
		const reservedKeys = new Set(["pagination", "page", "limit", "total", "totalPages"])
		if (options.meta && Object.keys(options.meta).some((key) => reservedKeys.has(key))) {
			return res.err(c, "Pagination meta keys are reserved", {
				status: 500,
				code: "INTERNAL_ERROR",
			})
		}
		return res.ok(
			c,
			{ items: data },
			{
				...options,
				meta: { pagination, ...options.meta },
			},
		)
	},

	err: (
		c: Context,
		error: string,
		options: ResponseOptions & { code?: string; details?: unknown } = {},
	) => {
		const response: ErrorResponse = {
			error,
			code: options.code ?? "UNKNOWN_ERROR",
		}
		if (options.details !== undefined) response.details = options.details

		return c.json(response, options.status ?? 400)
	},

	badRequest: (c: Context, error: string, details?: unknown) =>
		res.err(c, error, { status: 400, code: "BAD_REQUEST", details }),

	unauthorized: (c: Context, error = "Unauthorized") =>
		res.err(c, error, { status: 401, code: "UNAUTHORIZED" }),

	// Specific authentication error codes
	missingToken: (c: Context, error = "Access token required") =>
		res.err(c, error, { status: 401, code: "MISSING_TOKEN" }),

	invalidToken: (c: Context, error = "Invalid access token") =>
		res.err(c, error, { status: 401, code: "INVALID_TOKEN" }),

	expiredToken: (c: Context, error = "Access token expired") =>
		res.err(c, error, { status: 401, code: "EXPIRED_TOKEN" }),

	invalidRefreshToken: (c: Context, error = "Invalid or expired refresh token") =>
		res.err(c, error, { status: 401, code: "INVALID_REFRESH_TOKEN" }),

	invalidOtp: (c: Context, error = "Invalid OTP! Please check and try again.") =>
		res.err(c, error, { status: 401, code: "OTP_INVALID" }),

	expiredOtp: (c: Context, error = "OTP has expired") =>
		res.err(c, error, { status: 401, code: "EXPIRED_OTP" }),

	tooManyOtpAttempts: (c: Context, error = "Too many failed attempts. Please request a new OTP.") =>
		res.err(c, error, { status: 401, code: "OTP_MAX_ATTEMPTS" }),

	// Rate limiting errors
	rateLimited: (c: Context, error = "Too many requests, try again later") =>
		res.err(c, error, { status: 429, code: "RATE_LIMITED" }),

	otpRateLimited: (c: Context, error = "Too many OTP requests, try again later") =>
		res.err(c, error, { status: 429, code: "OTP_RATE_LIMITED" }),

	forbidden: (c: Context, error = "Forbidden") =>
		res.err(c, error, { status: 403, code: "FORBIDDEN" }),

	notFound: (c: Context, error = "Not found") =>
		res.err(c, error, { status: 404, code: "NOT_FOUND" }),

	conflict: (c: Context, error: string, details?: unknown) =>
		res.err(c, error, { status: 409, code: "CONFLICT", details }),

	validationError: (c: Context, details: unknown) =>
		res.err(c, "Validation failed", { status: 422, code: "VALIDATION_ERROR", details }),

	tooManyRequests: (c: Context, error = "Too many requests") =>
		res.err(c, error, { status: 429, code: "TOO_MANY_REQUESTS" }),

	internalError: (c: Context, error = "Internal server error") =>
		res.err(c, error, { status: 500, code: "INTERNAL_ERROR" }),

	serviceUnavailable: (c: Context, error = "Service unavailable") =>
		res.err(c, error, { status: 503, code: "SERVICE_UNAVAILABLE" }),

	// Database and external service errors
	databaseError: (c: Context, error = "Database operation failed") =>
		res.err(c, error, { status: 500, code: "DATABASE_ERROR" }),

	smsServiceError: (c: Context, error = "SMS service unavailable") =>
		res.err(c, error, { status: 503, code: "SMS_SERVICE_ERROR" }),

	// User-specific errors
	userNotFound: (c: Context, error = "User not found") =>
		res.err(c, error, { status: 404, code: "USER_NOT_FOUND" }),

	userExists: (c: Context, error = "User already exists") =>
		res.err(c, error, { status: 409, code: "USER_EXISTS" }),

	profileIncomplete: (c: Context, error = "User profile incomplete") =>
		res.err(c, error, { status: 409, code: "PROFILE_INCOMPLETE" }),
}

// Export types
export type { ErrorResponse, PaginationMeta, ResponseOptions }
