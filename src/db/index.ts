import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { drizzle } from "drizzle-orm/bun-sqlite";

import { serverEnv } from "@/config/server-env";

export const dbFileName = serverEnv.dbFileName;
const dbDirectory = dirname(dbFileName);

if (dbDirectory !== ".") {
	mkdirSync(dbDirectory, { recursive: true });
}

export const sqlite = new Database(dbFileName);

sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA journal_mode = WAL;");

const db = drizzle({ client: sqlite });

export default db;
