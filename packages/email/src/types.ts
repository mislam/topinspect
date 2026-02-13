import { type ReactElement } from "react"

export type EmailTemplate = ReactElement

export interface EmailOptions {
	from: string
	to: string
	subject: string
	template: EmailTemplate
}

export interface EmailProvider {
	send(options: EmailOptions): Promise<void>
}
