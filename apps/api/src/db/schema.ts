import { createId } from "@paralleldrive/cuid2"
import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core"

import type { InferInsertModel, InferSelectModel } from "drizzle-orm"

// Enums
export const genderEnum = pgEnum("gender", ["male", "female"])
export const authProviderEnum = pgEnum("auth_provider", [
	"phone", // Phone/OTP authentication
	"google", // Google Sign-In
	"apple", // Apple Sign-In
])

// Authentication Table (Core auth data)
// Allows only one provider per user: phone/google/apple
export const auth = pgTable(
	"auth",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		provider: authProviderEnum("provider").notNull(), // Which auth method was used
		identifier: text("identifier").notNull(), // Phone number (for phone) or OAuth provider ID (for google/apple)
		email: text("email").unique(), // Primary email (nullable if phone-only)
	},
	(table) => [
		// Unique constraint: one identifier per provider type globally
		// For phone: ensures global phone uniqueness
		// For OAuth: ensures provider ID uniqueness per provider
		unique("auth_provider_identifier_unique").on(table.provider, table.identifier),
	],
)

// Users Table (User identity and profile data)
// Shared primary key with AUTH: users.id === auth.id
export const users = pgTable("users", {
	id: text("id")
		.primaryKey()
		.references(() => auth.id, { onDelete: "cascade" }),
	name: text("name").notNull(),
	gender: genderEnum("gender").notNull(),
	birthYear: integer("birth_year").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

// OTPs Table
export const otps = pgTable(
	"otps",
	{
		phone: text("phone").primaryKey(),
		code: text("code").notNull(),
		attempts: integer("attempts").default(0).notNull(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// Composite index for rate limiting queries (phone + created_at)
		index("otps_phone_created_at_idx").on(table.phone, table.createdAt),
		// Index for cleanup jobs (expires_at)
		index("otps_expires_at_idx").on(table.expiresAt),
	],
)

// Refresh Tokens Table
export const tokens = pgTable(
	"tokens",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => createId()),
		authId: text("auth_id")
			.references(() => auth.id, { onDelete: "cascade" })
			.notNull(),
		token: text("token").unique().notNull(),
		deviceInfo: jsonb("device_info"),
		expiresAt: timestamp("expires_at").notNull(),
		revokedAt: timestamp("revoked_at"), // For security - mark tokens as revoked
		lastUsedAt: timestamp("last_used_at").defaultNow().notNull(), // Activity tracking
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(table) => [
		// Index for auth lookups
		index("tokens_auth_idx").on(table.authId),
		// Index for cleanup jobs (expires_at)
		index("tokens_expires_at_idx").on(table.expiresAt),
	],
)

// Type Inference
export type Auth = InferSelectModel<typeof auth>
export type NewAuth = InferInsertModel<typeof auth>

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type OTP = InferSelectModel<typeof otps>
export type NewOTP = InferInsertModel<typeof otps>

export type Token = InferSelectModel<typeof tokens>
export type NewToken = InferInsertModel<typeof tokens>
