import { render } from "@react-email/render"

import { type EmailOptions, type EmailProvider } from "../types"

const API_URL = "https://api.postmarkapp.com/email"

export class PostmarkProvider implements EmailProvider {
	private apiKey: string

	constructor(apiKey: string) {
		this.apiKey = apiKey
	}

	async send(options: EmailOptions): Promise<void> {
		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Postmark-Server-Token": this.apiKey,
			},
			body: JSON.stringify({
				From: options.from,
				To: options.to,
				Subject: options.subject,
				HtmlBody: await render(options.template),
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`Postmark send failed: ${error}`)
		}
	}
}
