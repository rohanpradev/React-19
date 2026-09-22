import { afterAll, beforeAll, expect, test } from "bun:test";

const baseURL = "http://localhost:3098";
const testEnvironment = {
	NODE_ENV: "development",
	DB_FILE_NAME: ":memory:",
	BETTER_AUTH_URL: baseURL,
	BETTER_AUTH_SECRET: "isolated-auth-regression-secret-for-tests",
	BETTER_AUTH_SECRETS: undefined,
	BETTER_AUTH_TRUSTED_ORIGINS: undefined,
	GOOGLE_CLIENT_ID: undefined,
	GOOGLE_CLIENT_SECRET: undefined,
	GITHUB_CLIENT_ID: undefined,
	GITHUB_CLIENT_SECRET: undefined,
};
const previousEnvironment = Object.fromEntries(
	Object.keys(testEnvironment).map((key) => [key, process.env[key]]),
);

function setEnvironment(values: Record<string, string | undefined>) {
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined) delete process.env[key];
		else process.env[key] = value;
	}
}

let auth: typeof import("./server").auth;
let sqlite: typeof import("../db").sqlite;

beforeAll(async () => {
	setEnvironment(testEnvironment);
	// Import only after isolating the database and removing local OAuth credentials.
	const { initializeDatabase } = await import("../db/init");
	initializeDatabase();
	({ auth } = await import("./server"));
	({ sqlite } = await import("../db"));
	const now = new Date().toISOString();
	sqlite
		.query(
			"INSERT INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
		)
		.run("legacy-user", "Legacy fixture", "legacy@example.test", 0, now, now);
	// Produced by Better Auth 1.6.26 for the disposable password below.
	const legacyPassword =
		"38ade85282962e859aafb7601af33104:2eb43dbafb502f5f2bc3abd09944f853c7875aff6ae3a77500c73c4d188e2310aa94e3a65fda3819c8e6b05a00efc7c70a578ec995a0432572de8ff91251148e";
	sqlite
		.query(
			"INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
		)
		.run("legacy-account", "legacy-user", "credential", "legacy-user", legacyPassword, now, now);
});

afterAll(() => {
	sqlite?.close();
	setEnvironment(previousEnvironment);
});

function request(path: string, body?: unknown, cookie?: string, origin = baseURL) {
	return auth.handler(
		new Request(`${baseURL}/api/auth/${path}`, {
			method: body ? "POST" : "GET",
			headers: { origin, "content-type": "application/json", ...(cookie ? { cookie } : {}) },
			...(body ? { body: JSON.stringify(body) } : {}),
		}),
	);
}

function cookies(response: Response) {
	return response.headers
		.getSetCookie()
		.map((value) => value.split(";")[0])
		.join("; ");
}

test("1.6 credentials retain their existing account identity after the upgrade", async () => {
	const response = await request("sign-in/email", {
		email: "legacy@example.test",
		password: "Upgrade-check-2026!",
	});
	expect(response.status).toBe(200);
	const result = await response.json();
	expect(result.user.id).toBe("legacy-user");
	expect(
		sqlite.query("SELECT count(*) AS count FROM account WHERE userId = ?").get("legacy-user"),
	).toEqual({ count: 1 });
	const session = await request(
		"get-session?disableCookieCache=true",
		undefined,
		cookies(response),
	);
	expect((await session.json()).user.id).toBe("legacy-user");
});

test("registration, session reads, and sign-out work with the existing core schema", async () => {
	const response = await request("sign-up/email", {
		name: "New fixture",
		email: "new@example.test",
		password: "New-fixture-password-2026!",
	});
	expect(response.status).toBe(200);
	const cookie = cookies(response);
	const session = await request("get-session?disableCookieCache=true", undefined, cookie);
	expect((await session.json()).user.email).toBe("new@example.test");
	expect((await request("sign-out", {}, cookie)).status).toBe(200);
	const revoked = await request("get-session?disableCookieCache=true", undefined, cookie);
	expect(await revoked.json()).toBeNull();
});

test("invalid credentials and untrusted mutation origins remain rejected", async () => {
	const body = { email: "legacy@example.test", password: "Incorrect-password-2026!" };
	expect((await request("sign-in/email", body)).status).toBe(401);
	expect(
		(await request("sign-in/email", body, undefined, "https://untrusted.example.test")).status,
	).toBe(403);
});
