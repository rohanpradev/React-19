import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import db from "@/db";
import { seedCustomers } from "@/db/seed";

let isInitialized = false;

export function initializeDatabase() {
	if (isInitialized) {
		return;
	}

	migrate(db, { migrationsFolder: "./drizzle" });
	seedCustomers();

	isInitialized = true;
}
