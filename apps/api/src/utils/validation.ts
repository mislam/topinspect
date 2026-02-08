import { zValidator } from "@hono/zod-validator"

import type { Context } from "hono"
import type { z } from "zod"

import { res } from "@/utils/response"

// Type for validated route handlers
export type Handler<T extends z.ZodType> = (
	c: Context<{ Variables: { validated: z.infer<T> } }>,
) => Response | Promise<Response>

/**
 * Creates a JSON validator middleware with consistent error handling
 * @param schema - Zod schema for validation
 * @returns Hono middleware for JSON validation
 */
export const validate = <T extends z.ZodType>(schema: T) =>
	zValidator("json", schema, (result, c) => {
		if (!result.success) {
			return res.validationError(c, result.error.issues)
		}
		;(c as Context<{ Variables: { validated: z.infer<T> } }>).set("validated", result.data)
	})

/**
 * Creates a query parameter validator middleware with consistent error handling
 * @param schema - Zod schema for query validation
 * @returns Hono middleware for query parameter validation
 */
export const validateQuery = <T extends z.ZodType>(schema: T) =>
	zValidator("query", schema, (result, c) => {
		if (!result.success) {
			return res.validationError(c, result.error.issues)
		}
		;(c as Context<{ Variables: { validated: z.infer<T> } }>).set("validated", result.data)
	})
