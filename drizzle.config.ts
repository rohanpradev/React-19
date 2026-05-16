import { defineConfig } from "drizzle-kit";

const dbFileName = Bun.env.DB_FILE_NAME ?? "mydb.sqlite";

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	casing: "snake_case",
	dbCredentials: {
		url: dbFileName,
	},
});
