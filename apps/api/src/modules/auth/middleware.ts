import { eq } from "drizzle-orm"
import { verify } from "hono/jwt"

import type { JwtPayload } from "@prism/types"
import type { Context, Next } from "hono"

import { getDb } from "@/adapters/database"
import { users } from "@/db/schema"
import { getEnv } from "@/utils/env"
import { res } from "@/utils/response"

// Verify an access token (local to middleware since it's only used here)
const verifyAccessToken = async (c: Context, token: string): Promise<JwtPayload> => {
	const payload = (await verify(token, getEnv(c).JWT_SECRET, "HS256")) as unknown as JwtPayload
	return payload
}

export const requireAuth = async (c: Context, next: Next) => {
	const db = getDb(c)
	const authHeader = c.req.header("Authorization")

	if (!authHeader?.startsWith("Bearer ")) {
		return res.missingToken(c)
	}

	const token = authHeader.split(" ")[1]
	try {
		const decoded = await verifyAccessToken(c, token)
		// Enforce user existence
		const [user] = await db.select().from(users).where(eq(users.id, decoded.sub)).limit(1)
		if (!user) {
			return res.conflict(c, "Profile required")
		}
		c.set("user", { id: decoded.sub })
		await next()
	} catch (error) {
		// Only log actual security issues, not normal expired tokens
		if (error instanceof Error && error.message.includes("expired")) {
			// Don't log expired tokens - this is normal user behavior
			return res.expiredToken(c)
		} else {
			// Log potential security issues
			console.warn("Access token verification failed:", {
				error: error instanceof Error ? error.message : "Unknown error",
				tokenPrefix: token.substring(0, 10) + "...",
			})
			return res.invalidToken(c)
		}
	}
}
