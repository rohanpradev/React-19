import { afterAll, beforeAll, expect, test } from "bun:test";

import { betterAuth } from "better-auth";

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
	const injected = await request("sign-up/email", {
		name: "Privilege injection",
		email: "new@example.test",
		password: "New-fixture-password-2026!",
		role: "admin",
	});
	expect(injected.status).toBe(400);
	expect(sqlite.query("SELECT id FROM user WHERE email=?").get("new@example.test")).toBeNull();
	const response = await request("sign-up/email", {
		name: "New fixture",
		email: "new@example.test",
		password: "New-fixture-password-2026!",
	});
	expect(response.status).toBe(200);
	const cookie = cookies(response);
	const session = await request("get-session?disableCookieCache=true", undefined, cookie);
	const { user } = await session.json();
	expect(user.email).toBe("new@example.test");
	expect(user.role).toBe("viewer");
	const profileInjection = await request("update-user", { role: "admin" }, cookie);
	expect(profileInjection.status).toBe(400);
	expect(sqlite.query("SELECT role FROM user WHERE id=?").get(user.id)).toEqual({ role: "viewer" });
	expect((await request("admin/set-role", { userId: user.id, role: "admin" }, cookie)).status).toBe(
		403,
	);
	expect((await request("sign-out", {}, cookie)).status).toBe(200);
	const revoked = await request("get-session?disableCookieCache=true", undefined, cookie);
	expect(await revoked.json()).toBeNull();
});

test("administrators cannot bypass guarded access changes through Better Auth admin endpoints", async () => {
	const signedIn = await request("sign-in/email", {
		email: "legacy@example.test",
		password: "Upgrade-check-2026!",
	});
	const cookie = cookies(signedIn);
	sqlite.query("UPDATE user SET role='admin' WHERE id=?").run("legacy-user");
	try {
		for (const [endpoint, payload] of [
			["admin/set-role", { userId: "legacy-user", role: "viewer" }],
			["admin/update-user", { userId: "legacy-user", data: { role: "viewer" } }],
			["admin/ban-user", { userId: "legacy-user" }],
			["admin/remove-user", { userId: "legacy-user" }],
			["admin/impersonate-user", { userId: "legacy-user" }],
			[
				"admin/create-user",
				{
					email: "unwanted@example.test",
					name: "Unwanted",
					password: "Unwanted-password-2026!",
					role: "admin",
				},
			],
			[
				"admin/set-user-password",
				{ userId: "legacy-user", newPassword: "Unwanted-password-2026!" },
			],
			["admin/revoke-user-sessions", { userId: "legacy-user" }],
		] as const) {
			expect((await request(endpoint, payload, cookie)).status).toBe(403);
		}
		expect(
			(
				await request("admin/create-user", {
					email: "anonymous@example.test",
					name: "Anonymous",
					password: "Unwanted-password-2026!",
				})
			).status,
		).toBe(401);
		expect(
			sqlite
				.query("SELECT id FROM user WHERE email IN (?, ?)")
				.all("unwanted@example.test", "anonymous@example.test"),
		).toEqual([]);
		expect(sqlite.query("SELECT role FROM user WHERE id=?").get("legacy-user")).toEqual({
			role: "admin",
		});
	} finally {
		sqlite.query("UPDATE user SET role='viewer' WHERE id=?").run("legacy-user");
	}
});

test("oversized sign-in passwords are rejected before verification", async () => {
	const response = await request("sign-in/email", {
		email: "legacy@example.test",
		password: "x".repeat(129),
	});
	expect(response.status).toBe(400);
	expect((await response.json()).code).toBe("PASSWORD_TOO_LONG");
});

test("protected API authorization rejects a revoked session with an unexpired cached cookie", async () => {
	const { requireRequestSession } = await import("../server/auth");
	// Simulate cookies issued by a deployment that still used the presentation cache.
	const legacyAuth = betterAuth({
		...auth.options,
		session: {
			...auth.options.session,
			cookieCache: { enabled: true, maxAge: 60 * 5, strategy: "compact" },
		},
	});
	const response = await legacyAuth.handler(
		new Request(`${baseURL}/api/auth/sign-up/email`, {
			method: "POST",
			headers: { origin: baseURL, "content-type": "application/json" },
			body: JSON.stringify({
				name: "Revocation fixture",
				email: "revoked@example.test",
				password: "Revocation-fixture-2026!",
			}),
		}),
	);
	expect(response.status).toBe(200);
	const cookie = cookies(response);
	expect(cookie).toContain("session_data=");
	const apiRequest = new Request(`${baseURL}/api/customers`, { headers: { cookie } });
	expect(await requireRequestSession(apiRequest)).not.toBeNull();
	const browserSession = await request("get-session", undefined, cookie);
	const { session } = await browserSession.json();
	expect(
		browserSession.headers
			.getSetCookie()
			.some((value) => value.includes("session_data=") && value.includes("Max-Age=0")),
	).toBe(true);
	// Remote revocation cannot clear cookies in this browser. Reuse the original cache cookie.
	sqlite.query("DELETE FROM session WHERE id = ?").run(session.id);
	expect(await requireRequestSession(apiRequest)).toBeNull();
	const revokedBrowserSession = await request("get-session", undefined, cookie);
	expect(await revokedBrowserSession.json()).toBeNull();
});

test("customer autocomplete uses the documented default and treats SQL wildcards literally", async () => {
	const { autocompleteCustomers } = await import("../server/customers");
	expect(
		autocompleteCustomers(new Request(`${baseURL}/api/customers/autocomplete`)).meta.limit,
	).toBe(8);
	const result = autocompleteCustomers(
		new Request(`${baseURL}/api/customers/autocomplete?query=%25`),
	);
	expect(result.items).toEqual([]);
	expect(result.meta.total).toBe(0);
});

test("invalid credentials and untrusted mutation origins remain rejected", async () => {
	const body = { email: "legacy@example.test", password: "Incorrect-password-2026!" };
	expect((await request("sign-in/email", body)).status).toBe(401);
	expect(
		(
			await request(
				"sign-in/email",
				body,
				"better-auth.session_token=invalid",
				"https://untrusted.example.test",
			)
		).status,
	).toBe(403);
});
