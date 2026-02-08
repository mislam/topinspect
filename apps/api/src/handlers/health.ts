import type { Context, Hono } from "hono"

import { checkDbHealth } from "@/adapters/database"
import { res } from "@/utils/response"

const checkHealth = async (c: Context) => {
	const dbHealth = await checkDbHealth(c)

	if (!dbHealth.healthy) {
		console.error(dbHealth.error)
		return res.serviceUnavailable(c, "Database connection failed")
	}

	return res.ok(c, { status: "healthy" })
}

export const registerRoutes = (app: Hono) => {
	app.get("/health", checkHealth)
}
