import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "@/db/schema";

export const dbFileName = Bun.env.DB_FILE_NAME ?? "mydb.sqlite";
export const sqlite = new Database(dbFileName);

sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA journal_mode = WAL;");

const db = drizzle({ client: sqlite, schema });

export default db;
