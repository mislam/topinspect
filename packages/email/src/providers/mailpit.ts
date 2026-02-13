import { render } from "@react-email/render"

import { type EmailOptions, type EmailProvider } from "../types"
import { parseAddress } from "../utils"

const API_URL = "http://localhost:8025/api/v1/send"

export class MailpitProvider implements EmailProvider {
	constructor() {}

	async send(options: EmailOptions): Promise<void> {
		const from = parseAddress(options.from)
		const to = parseAddress(options.to)

		const response = await fetch(API_URL, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				From: { Email: from.email, ...(from.name && { Name: from.name }) },
				To: [{ Email: to.email, ...(to.name && { Name: to.name }) }],
				Subject: options.subject,
				HTML: await render(options.template),
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			throw new Error(`Mailpit send failed: ${error}`)
		}
	}
}
