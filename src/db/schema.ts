import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { customerPlans, customerStatuses } from "@/lib/customer-table";

export * from "@/db/auth-schema";

export const customersTable = sqliteTable(
	"customers",
	{
		id: integer().primaryKey({ autoIncrement: true }),
		name: text().notNull(),
		email: text().notNull().unique(),
		company: text().notNull(),
		status: text({ enum: customerStatuses }).notNull(),
		plan: text({ enum: customerPlans }).notNull(),
		country: text().notNull(),
		annualValue: integer().notNull(),
		seats: integer().notNull(),
		lastSeenAt: integer().notNull(),
	},
	(table) => [
		index("customers_status_idx").on(table.status),
		index("customers_plan_idx").on(table.plan),
		index("customers_last_seen_idx").on(table.lastSeenAt),
	],
);

export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;
