import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

test("RBAC migration preserves existing credentials and sessions with foreign keys enabled", () => {
	const database = new Database(":memory:");
	const folder = path.resolve(import.meta.dir, "../../drizzle");
	const rbacMigration = "20261021023541_rbac";
	try {
		database.exec("PRAGMA foreign_keys = ON");
		for (const migration of readdirSync(folder)
			.filter((name) => name < rbacMigration)
			.sort()) {
			database.exec(readFileSync(path.join(folder, migration, "migration.sql"), "utf8"));
		}
		const now = new Date().toISOString();
		database
			.query(
				"INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)",
			)
			.run("existing", "Existing user", "existing@example.test", 1, now, now);
		database
			.query(
				"INSERT INTO account (id,accountId,providerId,userId,password,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)",
			)
			.run("credential", "existing", "credential", "existing", "unchanged-password-hash", now, now);
		database
			.query(
				"INSERT INTO session (id,userId,token,expiresAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?)",
			)
			.run("session", "existing", "unchanged-token", "2027-01-01T00:00:00.000Z", now, now);
		const sql = readFileSync(path.join(folder, rbacMigration, "migration.sql"), "utf8");
		// Match the migrator's transactional environment: PRAGMA foreign_keys=OFF
		// inside this transaction would be ineffective and a parent rebuild would cascade.
		database.transaction(() => database.exec(sql)).immediate();
		expect(database.query("SELECT role,banned FROM user WHERE id='existing'").get()).toEqual({
			role: "viewer",
			banned: 0,
		});
		expect(database.query("SELECT password FROM account WHERE id='credential'").get()).toEqual({
			password: "unchanged-password-hash",
		});
		expect(database.query("SELECT token FROM session WHERE id='session'").get()).toEqual({
			token: "unchanged-token",
		});
		expect(database.query("PRAGMA foreign_key_check").all()).toEqual([]);
		expect(database.query("PRAGMA foreign_keys").get()).toEqual({ foreign_keys: 1 });
		expect(() =>
			database.exec("UPDATE user SET role='admin,viewer' WHERE id='existing'"),
		).toThrow();
	} finally {
		database.close();
	}
});
