import { Database } from "bun:sqlite";
import { afterEach, beforeEach, expect, test } from "bun:test";

import type { AppRole } from "@/auth/permissions";

import { type AccessActor, AccessError, createAccessHandlers, createAccessService } from "./access";
import { listPlatformSignals, updatePlatformSignal } from "./platform-signals";

const origin = "https://workspace.example.test";
const pagination = { page: 1, limit: 25, auditPage: 1, auditLimit: 20 };
const administrator: AccessActor = { userId: "admin", sessionId: "session-admin" };
let database: Database;
let service: ReturnType<typeof createAccessService>;

function addUser(id: string, role: string, banned = 0, banExpires: string | null = null) {
	database
		.query(
			"INSERT INTO user (id, name, email, role, banned, banExpires, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
		)
		.run(id, id, `${id}@example.test`, role, banned, banExpires, new Date().toISOString());
	const now = Date.now();
	database
		.query("INSERT INTO session (id, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)")
		.run(
			`session-${id}`,
			id,
			new Date(now).toISOString(),
			new Date(now + 60 * 60 * 1000).toISOString(),
		);
	return { userId: id, sessionId: `session-${id}` };
}

function roleOf(id: string) {
	return database.query<{ role: string }, [string]>("SELECT role FROM user WHERE id = ?").get(id)
		?.role;
}

function sessionCount(id: string) {
	return database
		.query<{ count: number }, [string]>("SELECT count(*) AS count FROM session WHERE userId = ?")
		.get(id)?.count;
}

function auditCount() {
	return database.query<{ count: number }, []>("SELECT count(*) AS count FROM access_audit").get()
		?.count;
}

function expectAccessError(action: () => unknown, status: number, code: string) {
	expect(action).toThrow(AccessError);
	try {
		action();
	} catch (error) {
		expect(error).toMatchObject({ status, code });
	}
}

beforeEach(() => {
	database = new Database(":memory:");
	database.exec(`
		CREATE TABLE user (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
			role TEXT NOT NULL, banned INTEGER, banExpires TEXT, updatedAt TEXT NOT NULL);
		CREATE TABLE session (id TEXT PRIMARY KEY, userId TEXT NOT NULL, createdAt TEXT NOT NULL, expiresAt TEXT NOT NULL);
		CREATE TABLE access_audit (id TEXT PRIMARY KEY, actorId TEXT NOT NULL, targetId TEXT NOT NULL,
			previousRole TEXT, nextRole TEXT NOT NULL, createdAt TEXT NOT NULL, source TEXT NOT NULL);
	`);
	service = createAccessService(database);
	addUser("admin", "admin");
	addUser("viewer", "viewer");
	addUser("editor", "editor");
});

afterEach(() => database.close());

test("access listing supplies bounded pages, total counts, and independent audit pages", () => {
	service.updateRole(administrator, { userId: "viewer", role: "editor", expectedRole: "viewer" });
	service.updateRole(administrator, { userId: "editor", role: "admin", expectedRole: "editor" });
	const result = service.list(administrator, { page: 2, limit: 1, auditPage: 2, auditLimit: 1 });
	expect(result.currentUserId).toBe("admin");
	expect(result.users).toEqual([
		{ id: "editor", name: "editor", email: "editor@example.test", role: "admin" },
	]);
	expect(result.total).toBe(3);
	expect(result.auditTotal).toBe(2);
	expect(result.audit).toHaveLength(1);
	expect(result.audit[0]?.targetId).toBe("viewer");
	expect(service.list(administrator, { ...pagination, page: 100 }).users).toEqual([]);
});

test("viewer, editor, and unknown persisted roles cannot read or manage access", () => {
	for (const role of ["viewer", "editor", "owner", "admin,viewer", "Admin"]) {
		const actor = addUser(`actor-${role}`, role);
		expectAccessError(() => service.list(actor, pagination), 403, "forbidden");
		expectAccessError(
			() => service.updateRole(actor, { userId: "viewer", role: "admin", expectedRole: "viewer" }),
			403,
			"forbidden",
		);
	}
	expect(roleOf("viewer")).toBe("viewer");
	expect(sessionCount("viewer")).toBe(1);
	expect(auditCount()).toBe(0);
});

test("a role change records an audit entry and revokes every target session atomically", () => {
	database
		.query(
			"INSERT INTO session SELECT 'second-viewer-session', userId, createdAt, expiresAt FROM session WHERE id = 'session-viewer'",
		)
		.run();
	const user = service.updateRole(administrator, {
		userId: "viewer",
		role: "admin",
		expectedRole: "viewer",
	});
	expect(user).toEqual({
		id: "viewer",
		name: "viewer",
		email: "viewer@example.test",
		role: "admin",
	});
	expect(sessionCount("viewer")).toBe(0);
	expect(sessionCount("admin")).toBe(1);
	const audit = service.list(administrator, pagination).audit;
	expect(audit).toHaveLength(1);
	expect(audit[0]).toMatchObject({
		actorId: "admin",
		targetId: "viewer",
		previousRole: "viewer",
		nextRole: "admin",
		source: "role-change",
	});
	expect(Number.isFinite(Date.parse(audit[0]?.createdAt ?? ""))).toBe(true);
});

test("conflicting edits return a conflict without overwriting a committed role change", () => {
	const secondAdmin = addUser("second-admin", "admin");
	service.updateRole(administrator, { userId: "viewer", role: "editor", expectedRole: "viewer" });
	expectAccessError(
		() =>
			service.updateRole(secondAdmin, { userId: "viewer", role: "admin", expectedRole: "viewer" }),
		409,
		"role_conflict",
	);
	expect(roleOf("viewer")).toBe("editor");
	expect(auditCount()).toBe(1);
});

test("self no-ops leave sessions and audit untouched, while self-demotion is refused", () => {
	expect(
		service.updateRole(administrator, { userId: "admin", role: "admin", expectedRole: "admin" })
			.role,
	).toBe("admin");
	expect(sessionCount("admin")).toBe(1);
	expect(auditCount()).toBe(0);
	expectAccessError(
		() =>
			service.updateRole(administrator, { userId: "admin", role: "viewer", expectedRole: "admin" }),
		409,
		"last_admin",
	);
	addUser("other-admin", "admin");
	expectAccessError(
		() =>
			service.updateRole(administrator, { userId: "admin", role: "viewer", expectedRole: "admin" }),
		409,
		"self_role_change",
	);
	expect(roleOf("admin")).toBe("admin");
	expect(auditCount()).toBe(0);
});

test("banned administrators do not satisfy the last active administrator invariant", () => {
	addUser("banned-admin", "admin", 1);
	expectAccessError(
		() =>
			service.updateRole(administrator, { userId: "admin", role: "editor", expectedRole: "admin" }),
		409,
		"last_admin",
	);
	addUser("temporarily-banned", "admin", 1, new Date(Date.now() + 60_000).toISOString());
	expectAccessError(
		() =>
			service.updateRole(administrator, { userId: "admin", role: "editor", expectedRole: "admin" }),
		409,
		"last_admin",
	);
});

test("transaction authorization reloads actor roles and rejects revoked, mismatched, and expired sessions", () => {
	database.query("UPDATE user SET role = 'viewer' WHERE id = 'admin'").run();
	expectAccessError(
		() =>
			service.updateRole(administrator, {
				userId: "viewer",
				role: "admin",
				expectedRole: "viewer",
			}),
		403,
		"forbidden",
	);
	database.query("UPDATE user SET role = 'admin' WHERE id = 'admin'").run();
	expectAccessError(
		() => service.list({ ...administrator, sessionId: "session-viewer" }, pagination),
		401,
		"unauthenticated",
	);
	database
		.query("UPDATE session SET expiresAt = ? WHERE id = 'session-admin'")
		.run(new Date(Date.now() - 1).toISOString());
	expectAccessError(() => service.list(administrator, pagination), 401, "unauthenticated");
	database.query("DELETE FROM session WHERE id = 'session-admin'").run();
	expectAccessError(
		() =>
			service.updateRole(administrator, {
				userId: "viewer",
				role: "admin",
				expectedRole: "viewer",
			}),
		401,
		"unauthenticated",
	);
	expect(auditCount()).toBe(0);
});

test("role changes require a recent, valid session creation timestamp inside the transaction", () => {
	for (const createdAt of [
		new Date(Date.now() - 10 * 60 * 1000 - 1).toISOString(),
		"invalid",
		new Date(Date.now() + 60_000).toISOString(),
	]) {
		database.query("UPDATE session SET createdAt = ? WHERE id = 'session-admin'").run(createdAt);
		expect(service.list(administrator, pagination).total).toBe(3);
		expectAccessError(
			() =>
				service.updateRole(administrator, {
					userId: "viewer",
					role: "editor",
					expectedRole: "viewer",
				}),
			403,
			"reauthentication_required",
		);
	}
	expect(roleOf("viewer")).toBe("viewer");
	expect(sessionCount("viewer")).toBe(1);
	expect(auditCount()).toBe(0);
});

test("banned actors are rejected and expired bans are recognized only when the date is valid", () => {
	for (const banExpires of [null, "invalid", new Date(Date.now() + 60_000).toISOString()]) {
		database.query("UPDATE user SET banned = 1, banExpires = ? WHERE id = 'admin'").run(banExpires);
		expectAccessError(() => service.list(administrator, pagination), 401, "unauthenticated");
	}
	database
		.query("UPDATE user SET banExpires = ? WHERE id = 'admin'")
		.run(new Date(Date.now() - 60_000).toISOString());
	expect(service.list(administrator, pagination).total).toBe(3);
});

test("a failed audit insert rolls back both the role change and session revocation", () => {
	database.exec(
		"CREATE TRIGGER reject_audit BEFORE INSERT ON access_audit BEGIN SELECT RAISE(ABORT, 'audit unavailable'); END;",
	);
	expect(() =>
		service.updateRole(administrator, { userId: "viewer", role: "editor", expectedRole: "viewer" }),
	).toThrow("audit unavailable");
	expect(roleOf("viewer")).toBe("viewer");
	expect(sessionCount("viewer")).toBe(1);
	expect(auditCount()).toBe(0);
});

test("bootstrap promotes one existing user, revokes sessions, and writes the local audit source", () => {
	database.query("UPDATE user SET role = 'viewer' WHERE id = 'admin'").run();
	const result = service.bootstrapAdministrator("viewer");
	expect(result.role).toBe("admin");
	expect(sessionCount("viewer")).toBe(0);
	expect(
		database
			.query("SELECT actorId, targetId, previousRole, nextRole, source FROM access_audit")
			.get(),
	).toEqual({
		actorId: "local-bootstrap",
		targetId: "viewer",
		previousRole: "viewer",
		nextRole: "admin",
		source: "bootstrap",
	});
	expectAccessError(() => service.bootstrapAdministrator("editor"), 409, "admin_exists");
	expect(roleOf("editor")).toBe("editor");
	expect(auditCount()).toBe(1);
});

test("bootstrap refuses absent, banned, and invalid users and cannot bypass even a banned existing admin", () => {
	database.query("UPDATE user SET banned = 1 WHERE id = 'admin'").run();
	expectAccessError(() => service.bootstrapAdministrator("viewer"), 409, "admin_exists");
	database.query("UPDATE user SET role = 'viewer' WHERE id = 'admin'").run();
	expectAccessError(() => service.bootstrapAdministrator("missing"), 404, "user_not_found");
	expectAccessError(() => service.bootstrapAdministrator("admin"), 409, "invalid_bootstrap_user");
	addUser("invalid", "owner");
	expectAccessError(() => service.bootstrapAdministrator("invalid"), 409, "invalid_bootstrap_user");
	expectAccessError(() => service.bootstrapAdministrator(" viewer "), 400, "invalid_user_id");
	expect(auditCount()).toBe(0);
});

test("HTTP access handlers enforce authentication, origins, JSON type, payload bounds, and exact roles", async () => {
	let actor: AccessActor | null = null;
	const handlers = createAccessHandlers({
		service,
		canonicalOrigin: origin,
		resolveActor: async () => actor,
	});
	const listRequest = (query = "") => new Request(`${origin}/api/access${query}`);
	const updateRequest = (body: unknown, headers: Record<string, string> = {}) =>
		new Request(`${origin}/api/access/roles`, {
			method: "PATCH",
			headers: { origin, "content-type": "application/json", ...headers },
			body: typeof body === "string" ? body : JSON.stringify(body),
		});
	expect((await handlers.list(listRequest())).status).toBe(401);
	actor = { userId: "viewer", sessionId: "session-viewer" };
	expect((await handlers.list(listRequest())).status).toBe(403);
	const command = { userId: "viewer", role: "editor", expectedRole: "viewer" };
	expect((await handlers.updateRole(updateRequest(command))).status).toBe(403);
	actor = administrator;
	for (const query of [
		"?page=0",
		"?page=-1",
		"?page=1.5",
		"?limit=101",
		"?auditLimit=51",
		"?page=1&page=2",
		"?page=1e2",
		"?page=1000001",
	]) {
		expect((await handlers.list(listRequest(query))).status).toBe(400);
	}
	const listed = await handlers.list(listRequest("?page=1&limit=2&auditLimit=1"));
	expect(listed.status).toBe(200);
	expect(listed.headers.get("cache-control")).toBe("no-store");
	expect((await listed.json()).users).toHaveLength(2);
	expect(
		(await handlers.updateRole(updateRequest(command, { origin: "https://attacker.test" }))).status,
	).toBe(403);
	expect(
		(await handlers.updateRole(updateRequest(command, { "content-type": "text/plain" }))).status,
	).toBe(415);
	expect((await handlers.updateRole(updateRequest("{"))).status).toBe(400);
	expect(
		(await handlers.updateRole(updateRequest({ ...command, extra: "x".repeat(4096) }))).status,
	).toBe(413);
	for (const body of [
		{ ...command, role: ["admin"] },
		{ ...command, role: "admin,viewer" },
		{ ...command, role: "owner" },
		{ userId: "viewer", role: "admin" },
		{ ...command, extra: true },
		{ ...command, userId: " viewer " },
		null,
	]) {
		expect((await handlers.updateRole(updateRequest(body))).status).toBe(400);
	}
	expect(auditCount()).toBe(0);
	const changed = await handlers.updateRole(updateRequest(command));
	expect(changed.status).toBe(200);
	expect((await changed.json()).user.role).toBe("editor");
});

test("direct role mutation also rejects unsupported role values", () => {
	expectAccessError(
		() =>
			service.updateRole(administrator, {
				userId: "viewer",
				role: "owner" as AppRole,
				expectedRole: "viewer",
			}),
		400,
		"invalid_role_command",
	);
	expect(auditCount()).toBe(0);
});

test("a signal write cannot commit after its editor is demoted while streaming the request body", async () => {
	const editor = { userId: "editor", sessionId: "session-editor" };
	service.authorize(editor, { signals: ["write"] });
	let releaseBody: (() => void) | undefined;
	const stream = new ReadableStream<Uint8Array>({
		start(controller) {
			releaseBody = () => {
				controller.enqueue(new TextEncoder().encode('{"id":"query-cache","status":"watch"}'));
				controller.close();
			};
		},
	});
	const before = listPlatformSignals();
	const pending = updatePlatformSignal(
		new Request(`${origin}/api/platform/signals`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: stream,
		}),
		() => {
			try {
				service.authorize(editor, { signals: ["write"] });
				return null;
			} catch (error) {
				if (error instanceof AccessError)
					return Response.json({ code: error.code }, { status: error.status });
				throw error;
			}
		},
	);
	service.updateRole(administrator, { userId: "editor", role: "viewer", expectedRole: "editor" });
	releaseBody?.();
	expect((await pending).status).toBe(401);
	expect(listPlatformSignals()).toEqual(before);
});
