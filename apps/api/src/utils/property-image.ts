import type { Context } from "hono"

import { getEnv } from "@/utils/env"

export async function getPropertyImage(c: Context, address: string): Promise<string | null> {
	if (!address.trim()) {
		return null
	}

	const params = new URLSearchParams({
		size: "640x480",
		location: address,
		fov: "80", // slight zoom → focuses on house
		pitch: "5", // subtle upward tilt → better facade visibility
		// NO heading → let Google auto-face the front
		key: getEnv(c).GOOGLE_MAPS_API_KEY,
	})

	const url = `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`

	const res = await fetch(url, { method: "HEAD" })
	if (!res.ok || parseInt(res.headers.get("Content-Length") || "0") < 1000) {
		return null
	}

	return url
}
