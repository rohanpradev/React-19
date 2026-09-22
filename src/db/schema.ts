import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
		check(
			"customers_status_check",
			sql`${table.status} in ('active', 'paused', 'trial', 'churned')`,
		),
		check(
			"customers_plan_check",
			sql`${table.plan} in ('starter', 'growth', 'business', 'enterprise')`,
		),
		check("customers_annual_value_check", sql`${table.annualValue} >= 0`),
		check("customers_seats_check", sql`${table.seats} > 0`),
		check("customers_last_seen_at_check", sql`${table.lastSeenAt} > 0`),
		index("customers_status_idx").on(table.status),
		index("customers_plan_idx").on(table.plan),
		index("customers_last_seen_idx").on(table.lastSeenAt),
		index("customers_status_plan_last_seen_idx").on(table.status, table.plan, table.lastSeenAt),
	],
);

export type Customer = typeof customersTable.$inferSelect;
export type NewCustomer = typeof customersTable.$inferInsert;
