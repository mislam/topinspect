import { Resend } from "resend"

import { type EmailOptions, type EmailProvider } from "../types"

export class ResendProvider implements EmailProvider {
	private apiKey: string

	constructor(apiKey: string) {
		this.apiKey = apiKey
	}

	async send(options: EmailOptions): Promise<void> {
		const resend = new Resend(this.apiKey)
		const { error } = await resend.emails.send({
			from: options.from,
			to: options.to,
			subject: options.subject,
			react: options.template,
		})

		if (error) {
			throw new Error(`Resend send failed: ${error.message}`)
		}
	}
}
