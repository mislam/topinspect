/**
 * Parse RFC 5322 address format: "Display Name <email@domain.com>" or "email@domain.com"
 */
export function parseAddress(addr: string): { email: string; name?: string } {
	const trimmed = addr.trim()
	const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
	if (match) {
		return {
			name: match[1].trim().replace(/^["']|["']$/g, ""),
			email: match[2].trim(),
		}
	}
	return { email: trimmed }
}
