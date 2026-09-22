import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import db from "@/db";

const migrationsFolder = resolve(process.cwd(), "drizzle");

export function runMigrations() {
	if (!existsSync(migrationsFolder)) {
		throw new Error(`Drizzle migrations folder not found: ${migrationsFolder}`);
	}

	migrate(db, { migrationsFolder });
}
