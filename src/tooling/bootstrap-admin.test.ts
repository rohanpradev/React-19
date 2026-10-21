import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { projectRoot } from "./validation";

test("the local bootstrap command promotes only an explicit existing user, audits, and refuses repeat setup", () => {
	const tempRoot = realpathSync(os.tmpdir());
	const folder = mkdtempSync(path.join(tempRoot, "studio-rbac-"));
	if (path.dirname(folder) !== tempRoot || !path.basename(folder).startsWith("studio-rbac-")) {
		throw new Error("Refusing cleanup outside the isolated bootstrap test directory.");
	}
	const databasePath = path.join(folder, "isolated.sqlite");
	const database = new Database(databasePath);
	try {
		const migrations = path.join(projectRoot, "drizzle");
		migrate(drizzle({ client: database }), { migrationsFolder: migrations });
		const now = new Date().toISOString();
		database
			.query(
				"INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)",
			)
			.run("explicit-user", "Fixture", "fixture@example.test", 0, now, now);
		database
			.query(
				"INSERT INTO session (id,userId,token,expiresAt,createdAt,updatedAt) VALUES (?,?,?,?,?,?)",
			)
			.run("old-session", "explicit-user", "old-token", "2027-01-01T00:00:00.000Z", now, now);
		const run = (...args: string[]) =>
			Bun.spawnSync(
				[process.execPath, "--no-env-file", "src/tooling/bootstrap-admin.ts", ...args],
				{
					cwd: projectRoot,
					env: {
						PATH: process.env["PATH"],
						SystemRoot: process.env["SystemRoot"],
						NODE_ENV: "development",
						DB_FILE_NAME: databasePath,
					},
					timeout: 5_000,
					killSignal: "SIGKILL",
					stdout: "pipe",
					stderr: "pipe",
				},
			);
		expect(run().exitCode).not.toBe(0);
		expect(database.query("SELECT role FROM user WHERE id='explicit-user'").get()).toEqual({
			role: "viewer",
		});
		const promoted = run("--user-id", "explicit-user");
		if (promoted.exitCode !== 0) throw new Error(new TextDecoder().decode(promoted.stderr));
		expect(promoted.exitCode).toBe(0);
		expect(database.query("SELECT role FROM user WHERE id='explicit-user'").get()).toEqual({
			role: "admin",
		});
		expect(database.query("SELECT count(*) AS count FROM session").get()).toEqual({ count: 0 });
		expect(database.query("SELECT actorId,targetId,source FROM access_audit").all()).toEqual([
			{ actorId: "local-bootstrap", targetId: "explicit-user", source: "bootstrap" },
		]);
		expect(run("--user-id", "explicit-user").exitCode).not.toBe(0);
		expect(database.query("SELECT count(*) AS count FROM access_audit").get()).toEqual({
			count: 1,
		});
	} finally {
		database.close();
		// mkdtemp returned this direct child; never recursively remove a computed outside path.
		rmSync(folder, { recursive: true, force: true });
	}
});
