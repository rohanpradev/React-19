import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const authUsersTable = sqliteTable(
	"user",
	{
		id: text().primaryKey(),
		name: text().notNull(),
		email: text().notNull().unique(),
		emailVerified: integer({ mode: "boolean" }).notNull(),
		image: text(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
		role: text({ enum: ["viewer", "editor", "admin"] })
			.notNull()
			.default("viewer"),
		banned: integer({ mode: "boolean" }).default(false),
		banReason: text(),
		banExpires: text(),
	},
	(table) => [check("user_role_check", sql`${table.role} in ('viewer', 'editor', 'admin')`)],
);

export const authSessionsTable = sqliteTable(
	"session",
	{
		id: text().primaryKey(),
		userId: text()
			.notNull()
			.references(() => authUsersTable.id, { onDelete: "cascade" }),
		token: text().notNull().unique(),
		expiresAt: text().notNull(),
		ipAddress: text(),
		userAgent: text(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
		impersonatedBy: text(),
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
);

// Audit history survives account deletion; actor and target IDs are recorded values.
export const accessAuditTable = sqliteTable(
	"access_audit",
	{
		id: text().primaryKey(),
		actorId: text().notNull(),
		targetId: text().notNull(),
		previousRole: text(),
		nextRole: text().notNull(),
		createdAt: text().notNull(),
		source: text({ enum: ["bootstrap", "role-change"] }).notNull(),
	},
	(table) => [index("access_audit_created_at_idx").on(table.createdAt, table.id)],
);

export const authAccountsTable = sqliteTable(
	"account",
	{
		id: text().primaryKey(),
		accountId: text().notNull(),
		providerId: text().notNull(),
		userId: text()
			.notNull()
			.references(() => authUsersTable.id, { onDelete: "cascade" }),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		accessTokenExpiresAt: text(),
		refreshTokenExpiresAt: text(),
		scope: text(),
		password: text(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
	},
	(table) => [
		index("account_user_id_idx").on(table.userId),
		uniqueIndex("account_provider_account_uidx").on(table.providerId, table.accountId),
	],
);

export const authVerificationsTable = sqliteTable(
	"verification",
	{
		id: text().primaryKey(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: text().notNull(),
		createdAt: text().notNull(),
		updatedAt: text().notNull(),
	},
	(table) => [
		index("verification_identifier_idx").on(table.identifier),
		index("verification_expires_at_idx").on(table.expiresAt),
	],
);
