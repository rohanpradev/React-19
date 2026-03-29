import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const authUsersTable = sqliteTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull().unique(),
	emailVerified: integer({ mode: "boolean" }).notNull(),
	image: text(),
	createdAt: text().notNull(),
	updatedAt: text().notNull(),
});

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
	},
	(table) => [index("session_user_id_idx").on(table.userId)],
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
		uniqueIndex("account_provider_account_uidx").on(
			table.providerId,
			table.accountId,
		),
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
