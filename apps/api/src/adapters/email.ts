import { MailpitProvider, PostmarkProvider, ResendProvider } from "@prism/email"

import type { EmailOptions, EmailProvider } from "@prism/email"
import type { Context } from "hono"

import { getEnv, isDev } from "@/utils/env"

const getProvider = (c: Context): EmailProvider => {
	const apiKey = getEnv(c).EMAIL_API_KEY
	const provider = getEnv(c).EMAIL_PROVIDER
	switch (provider) {
		case "mailpit":
			return new MailpitProvider()
		case "postmark":
			return new PostmarkProvider(apiKey)
		case "resend":
			return new ResendProvider(apiKey)
		default:
			throw new Error(`Unknown email provider: ${provider}`)
	}
}

export const sendEmail = async (c: Context, options: Omit<EmailOptions, "from">) => {
	const provider = getProvider(c)
	await provider.send({
		from: getEnv(c).EMAIL_FROM,
		to: options.to,
		subject: options.subject,
		template: options.template,
	})

	if (isDev(c)) {
		console.log(`[EMAIL] sent to ${options.to}`)
	}
}
