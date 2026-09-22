import { defineConfig } from "drizzle-kit";

const dbFileName = process.env["DB_FILE_NAME"] ?? "mydb.sqlite";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: dbFileName,
	},
});
