import type { Context } from "hono"

// Central helper to get typed bindings without sprinkling generics everywhere
export const getEnv = (c: Context): CloudflareBindings => c.env as unknown as CloudflareBindings

// Convenient helper for environment check
export const isDev = (c: Context): boolean => getEnv(c).ENV === "development"

// Helper function to validate and get R2 configuration
export function getR2Config(c: Context) {
	const env = getEnv(c)
	const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ENDPOINT } = env

	if (
		(!isDev(c) && !R2_ACCESS_KEY_ID) ||
		(!isDev(c) && !R2_SECRET_ACCESS_KEY) ||
		!R2_BUCKET_NAME ||
		!R2_PUBLIC_URL ||
		!R2_ENDPOINT
	) {
		throw new Error("R2 configuration is missing")
	}

	return { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL, R2_ENDPOINT }
}
