import type { Context } from "hono"

import { getEnv, isDev } from "@/utils/env"

interface BulkSmsResponse {
	response_code: number
	message_id?: number
	success_message?: string
	error_message?: string
}

export const sendOTP = async (c: Context, phone: string, otp: string) => {
	const appName = getEnv(c).APP_NAME
	const apiKey = getEnv(c).SMS_API_KEY
	const senderId = getEnv(c).SMS_SENDER_ID

	const message = `Your ${appName} OTP is ${otp}`

	// Development: log OTP instead of sending
	if (isDev(c)) {
		console.log(`[SMS] ${message}`)
		return
	}

	// TODO: Add IP-based rate limiting (Workers KV/DO or Cloudflare Rules)
	// TODO: Consider temporary phone lockouts after repeated failures

	// TODO: Add proper error handling for SMS failures (log, alert), with simple retry/backoff in `waitUntil`
	if (!apiKey) {
		console.warn("SMS_API_KEY not configured; skipping SMS send")
		return
	}

	// TODO: Add proper error handling for SMS failures (log, alert), with simple retry/backoff in `waitUntil`
	if (!senderId) {
		console.warn("SMS_SENDER_ID not configured; skipping SMS send")
		return
	}

	const url = "https://bulksmsbd.net/api/smsapi"
	const payload = {
		api_key: apiKey,
		senderid: senderId,
		number: `880${phone.substring(1)}`,
		message,
	}

	try {
		const res = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		})
		const data = (await res.json()) as BulkSmsResponse
		if (data.response_code !== 202) {
			console.error("SMS send failed", { url, payload: { ...payload, api_key: "******" }, data })
		}
	} catch (error) {
		console.error("SMS send error", (error as Error).message)
	}
}
