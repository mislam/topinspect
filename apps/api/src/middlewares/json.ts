import type { MiddlewareHandler } from "hono"

import { res } from "@/utils/response"

/**
 * JSON validation middleware for application/json requests
 *
 * This middleware validates JSON request bodies before they reach business logic:
 * - Checks content-type is application/json (case-insensitive)
 * - Validates body is not empty
 * - Enforces 1MB size limit
 * - Validates JSON syntax
 *
 * ⚠️ IMPORTANT: This middleware consumes the request body stream
 * File uploads using multipart/form-data will bypass this middleware
 *
 * @returns MiddlewareHandler for Hono
 */
export const json: MiddlewareHandler = async (c, next) => {
	// Check if this is a JSON request (case-insensitive)
	const contentType = c.req.header("content-type")?.toLowerCase()
	if (!contentType || !contentType.includes("application/json")) {
		// Not a JSON request - pass to next middleware/route handler
		return await next()
	}

	// Check for empty or missing body
	const rawBody = await c.req.text()
	if (!rawBody || rawBody.trim() === "") {
		return res.validationError(c, [
			{
				code: "EMPTY_BODY",
				message: "Request body cannot be empty",
				path: ["body"],
			},
		])
	}

	// Check body size (1MB limit for JSON payloads)
	const MAX_BODY_SIZE = 1024 * 1024 // 1MB
	if (rawBody.length > MAX_BODY_SIZE) {
		return res.validationError(c, [
			{
				code: "BODY_TOO_LARGE",
				message: "Request body exceeds size limit (1MB)",
				path: ["body"],
			},
		])
	}

	// Validate JSON syntax
	try {
		JSON.parse(rawBody)
	} catch (error) {
		if (error instanceof SyntaxError) {
			return res.validationError(c, [
				{
					code: "INVALID_JSON",
					message: "Invalid JSON format in request body",
					path: ["body"],
				},
			])
		}
		return res.validationError(c, [
			{
				code: "BODY_PARSE_ERROR",
				message: "Request body could not be parsed",
				path: ["body"],
			},
		])
	}

	// JSON is valid - continue to next middleware/route handler
	await next()
}
