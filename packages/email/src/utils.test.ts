import { describe, expect, it } from "vitest"

import { parseAddress } from "./utils"

describe("parseAddress", () => {
	it("parses plain email address", () => {
		expect(parseAddress("user@example.com")).toEqual({ email: "user@example.com" })
	})

	it("parses RFC 5322 format with display name", () => {
		expect(parseAddress("John Doe <john@example.com>")).toEqual({
			email: "john@example.com",
			name: "John Doe",
		})
	})

	it("trims whitespace around address", () => {
		expect(parseAddress("  user@example.com  ")).toEqual({ email: "user@example.com" })
		expect(parseAddress("  John <john@example.com>  ")).toEqual({
			email: "john@example.com",
			name: "John",
		})
	})

	it("strips quotes from display name", () => {
		expect(parseAddress('"John Doe" <john@example.com>')).toEqual({
			email: "john@example.com",
			name: "John Doe",
		})
		expect(parseAddress("'Jane Smith' <jane@example.com>")).toEqual({
			email: "jane@example.com",
			name: "Jane Smith",
		})
	})

	it("handles display name with extra spaces before angle brackets", () => {
		expect(parseAddress("John Doe  <john@example.com>")).toEqual({
			email: "john@example.com",
			name: "John Doe",
		})
	})
})
