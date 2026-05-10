import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "@/db/schema";

export const dbFileName = Bun.env.DB_FILE_NAME ?? "mydb.sqlite";
const dbDirectory = dirname(dbFileName);

if (dbDirectory !== ".") {
	mkdirSync(dbDirectory, { recursive: true });
}

export const sqlite = new Database(dbFileName);

sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA journal_mode = WAL;");

const db = drizzle({ client: sqlite, schema });

export default db;
