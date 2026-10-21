import { Database } from "bun:sqlite";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { createAccessService } from "./server/access";

// Exercise the actual build with disposable data and no developer credentials.
const projectRoot = path.resolve(import.meta.dir, "..");
const probe = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
const port = probe.port;
probe.stop(true);
const origin = `http://127.0.0.1:${port}`;
const secret = crypto.randomUUID() + crypto.randomUUID();
const smokeDirectory = mkdtempSync(path.join(tmpdir(), "react-rbac-smoke-"));
const databasePath = path.join(smokeDirectory, "smoke.sqlite");
let smokeDatabase: Database | undefined;
const child = Bun.spawn([process.execPath, "--no-env-file", "dist/index.js"], {
	cwd: projectRoot,
	env: {
		PATH: process.env["PATH"],
		SystemRoot: process.env["SystemRoot"],
		NODE_ENV: "production",
		PORT: String(port),
		DB_FILE_NAME: databasePath,
		BETTER_AUTH_URL: origin,
		BETTER_AUTH_SECRET: secret,
	},
	stdout: "pipe",
	stderr: "pipe",
	timeout: 45_000,
	killSignal: "SIGKILL",
});
const output = new Response(child.stdout).text();
const errors = new Response(child.stderr).text();

// Bound every request, including body reads. A hung response must fail the probe.
function request(url: string, init?: RequestInit) {
	return fetch(url, { ...init, signal: AbortSignal.timeout(5_000), redirect: "error" });
}

function assertPrivate(response: Response, status: number) {
	assert.equal(response.status, status);
	assert.equal(response.headers.get("cache-control"), "no-store");
}

function cookies(response: Response) {
	return response.headers
		.getSetCookie()
		.map((value) => value.split(";")[0])
		.join("; ");
}

async function signIn(email: string, password: string) {
	const response = await request(`${origin}/api/auth/sign-in/email`, {
		method: "POST",
		headers: { origin, "content-type": "application/json" },
		body: JSON.stringify({ email, password }),
	});
	assertPrivate(response, 200);
	return cookies(response);
}

try {
	let ready = false;
	let readinessError = "No response";
	for (let attempt = 0; attempt < 100; attempt++) {
		if (child.exitCode !== null) throw new Error(`Production server exited: ${await errors}`);
		try {
			const response = await fetch(`${origin}/healthz`, {
				signal: AbortSignal.timeout(500),
			});
			if (response.ok) {
				ready = true;
				break;
			}
			readinessError = `HTTP ${response.status}: ${await response.text()}`;
		} catch (error) {
			readinessError = String(error);
		}
		await Bun.sleep(100);
	}
	assert(ready, `Production server did not become ready: ${readinessError}`);
	const health = await request(`${origin}/api/platform/health`);
	assertPrivate(health, 200);
	assert.equal((await health.json()).runtime.mode, "production");
	const healthHead = await request(`${origin}/healthz`, { method: "HEAD" });
	assertPrivate(healthHead, 200);
	assert.equal(await healthHead.text(), "");

	const document = await request(`${origin}/nested/deep-link`);
	assert.equal(document.status, 200);
	assert.equal(document.headers.get("cache-control"), "no-cache");
	const entityTag = document.headers.get("etag");
	assert(entityTag, "Production HTML must supply a cache validator.");
	const revalidated = await request(`${origin}/nested/deep-link`, {
		headers: { "if-none-match": entityTag },
	});
	assert.equal(revalidated.status, 304);
	assert.equal(await revalidated.text(), "");
	const html = await document.text();
	assert(!html.includes(secret), "The server secret must never be included in browser HTML.");
	const assets = [...html.matchAll(/(?:src|href)="(\/(?:chunk|favicon)-[^"]+)"/g)].map((match) => {
		assert(match[1], "Asset reference must contain a path.");
		return match[1];
	});
	assert(
		assets.length >= 3,
		"HTML must reference root-relative script, stylesheet, and icon assets.",
	);
	const manifest: string[] = await Bun.file(
		path.join(projectRoot, "dist/asset-manifest.json"),
	).json();
	assert(manifest.length >= assets.length);
	for (const asset of assets) assert(manifest.includes(asset), `Missing from manifest: ${asset}`);
	for (const asset of manifest) {
		const response = await request(`${origin}${asset}`);
		assert.equal(response.status, 200, asset);
		assert.match(response.headers.get("cache-control") ?? "", /immutable/);
		assert.notEqual(response.headers.get("content-type"), "text/html; charset=utf-8", asset);
		if (/\.(js|css)$/.test(asset)) {
			assert(!(await response.text()).includes(secret), `Server secret leaked into ${asset}.`);
		} else {
			await response.arrayBuffer();
		}
	}
	for (const pathname of [
		"/index.js",
		"/missing.js",
		"/asset-manifest.json",
		"/package.json",
		"/src/server.ts",
		"/api/unknown",
		"/.env",
		"/..%5cindex.js",
	]) {
		assert.equal((await request(`${origin}${pathname}`)).status, 404, pathname);
	}
	const unauthorized = await request(`${origin}/api/customers`);
	assert.equal(unauthorized.status, 401);
	assert.equal(unauthorized.headers.get("cache-control"), "no-store");
	const privilegeInjection = await request(`${origin}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { origin, "content-type": "application/json" },
		body: JSON.stringify({
			name: "Production smoke",
			email: "production-smoke@example.test",
			password: "Production-smoke-password-2026!",
			// Public registration must reject protected privilege fields.
			role: "admin",
		}),
	});
	assertPrivate(privilegeInjection, 400);
	const registration = await request(`${origin}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { origin, "content-type": "application/json" },
		body: JSON.stringify({
			name: "Production smoke",
			email: "production-smoke@example.test",
			password: "Production-smoke-password-2026!",
		}),
	});
	assert.equal(registration.status, 200);
	assert.equal(registration.headers.get("cache-control"), "no-store");
	const registeredUser = (await registration.json()).user;
	assert.equal(registeredUser.role, "viewer");
	let cookie = cookies(registration);
	assert(cookie, "Registration must preserve the authentication cookies.");
	const customers = await request(`${origin}/api/customers`, { headers: { cookie } });
	assert.equal(customers.status, 200);
	assert.equal(customers.headers.get("cache-control"), "no-store");
	assert(Array.isArray((await customers.json()).rows));
	assertPrivate(await request(`${origin}/api/access`, { headers: { cookie } }), 403);
	assertPrivate(await request(`${origin}/api/access`), 401);
	assertPrivate(
		await request(`${origin}/api/platform/signals`, {
			method: "PATCH",
			headers: { cookie, origin, "content-type": "application/json" },
			body: JSON.stringify({ id: "query-cache", status: "watch" }),
		}),
		403,
	);
	// Promote through the same local-only, audited domain command used by the bootstrap CLI.
	smokeDatabase = new Database(databasePath);
	smokeDatabase.exec("PRAGMA busy_timeout = 5000;");
	createAccessService(smokeDatabase).bootstrapAdministrator(registeredUser.id);
	assertPrivate(await request(`${origin}/api/customers`, { headers: { cookie } }), 401);
	cookie = await signIn("production-smoke@example.test", "Production-smoke-password-2026!");
	const access = await request(`${origin}/api/access`, { headers: { cookie } });
	assertPrivate(access, 200);
	assert.equal((await access.json()).audit[0].source, "bootstrap");
	for (const pathname of [
		"admin/set-role",
		"admin/ban-user",
		"admin/impersonate-user",
		"admin/remove-user",
	]) {
		assertPrivate(
			await request(`${origin}/api/auth/${pathname}`, {
				method: "POST",
				headers: { cookie, origin, "content-type": "application/json" },
				body: JSON.stringify({ userId: registeredUser.id, role: "editor" }),
			}),
			403,
		);
	}
	const viewerRegistration = await request(`${origin}/api/auth/sign-up/email`, {
		method: "POST",
		headers: { origin, "content-type": "application/json" },
		body: JSON.stringify({
			name: "Role target",
			email: "role-target@example.test",
			password: "Role-target-password-2026!",
		}),
	});
	assertPrivate(viewerRegistration, 200);
	const targetUser = (await viewerRegistration.json()).user;
	const viewerCookie = cookies(viewerRegistration);
	const setRole = (userId: string, role: string, expectedRole: string) =>
		request(`${origin}/api/access/roles`, {
			method: "PATCH",
			headers: { cookie, origin, "content-type": "application/json" },
			body: JSON.stringify({ userId, role, expectedRole }),
		});
	const selfDemotion = await setRole(registeredUser.id, "viewer", "admin");
	assertPrivate(selfDemotion, 409);
	assert.equal((await selfDemotion.json()).code, "last_admin");
	smokeDatabase
		.query("UPDATE session SET createdAt = ? WHERE userId = ?")
		.run(new Date(Date.now() - 11 * 60 * 1000).toISOString(), registeredUser.id);
	const staleSession = await setRole(targetUser.id, "editor", "viewer");
	assertPrivate(staleSession, 403);
	assert.equal((await staleSession.json()).code, "reauthentication_required");
	smokeDatabase
		.query("UPDATE session SET createdAt = ? WHERE userId = ?")
		.run(new Date().toISOString(), registeredUser.id);
	assertPrivate(await setRole(targetUser.id, "editor", "viewer"), 200);
	assertPrivate(
		await request(`${origin}/api/customers`, { headers: { cookie: viewerCookie } }),
		401,
	);
	const conflict = await setRole(targetUser.id, "admin", "viewer");
	assertPrivate(conflict, 409);
	assert.equal((await conflict.json()).code, "role_conflict");
	const editorCookie = await signIn("role-target@example.test", "Role-target-password-2026!");
	assertPrivate(
		await request(`${origin}/api/platform/signals`, {
			method: "PATCH",
			headers: { cookie: editorCookie, origin, "content-type": "application/json" },
			body: JSON.stringify({ id: "query-cache", status: "ready" }),
		}),
		200,
	);
	assertPrivate(await request(`${origin}/api/access`, { headers: { cookie: editorCookie } }), 403);
	assertPrivate(await setRole(targetUser.id, "viewer", "editor"), 200);
	assertPrivate(
		await request(`${origin}/api/platform/signals`, { headers: { cookie: editorCookie } }),
		401,
	);
	const refreshedViewerCookie = await signIn(
		"role-target@example.test",
		"Role-target-password-2026!",
	);
	assertPrivate(
		await request(`${origin}/api/platform/signals`, {
			method: "PATCH",
			headers: { cookie: refreshedViewerCookie, origin, "content-type": "application/json" },
			body: JSON.stringify({ id: "query-cache", status: "ready" }),
		}),
		403,
	);
	const finalAccess = await request(`${origin}/api/access?limit=1&auditLimit=1`, {
		headers: { cookie },
	});
	assertPrivate(finalAccess, 200);
	const finalAccessData = await finalAccess.json();
	assert.equal(finalAccessData.total, 2);
	assert.equal(finalAccessData.users.length, 1);
	assert.equal(finalAccessData.auditTotal, 3);
	assert.equal(finalAccessData.audit.length, 1);
	for (const pathname of [
		"/api/customers",
		"/api/customers/autocomplete",
		"/api/platform/health",
	]) {
		const denied = await request(`${origin}${pathname}`, { method: "POST", headers: { cookie } });
		assertPrivate(denied, 405);
		assert.equal(denied.headers.get("allow"), "GET, HEAD");
		const head = await request(`${origin}${pathname}`, { method: "HEAD", headers: { cookie } });
		assertPrivate(head, 200);
		assert.equal(await head.text(), "");
	}
	const mutation = { id: "query-cache", status: "watch" };
	const update = (body: string, headers: Record<string, string> = {}) =>
		request(`${origin}/api/platform/signals`, {
			method: "PATCH",
			headers: { cookie, origin, "content-type": "application/json", ...headers },
			body,
		});
	const updated = await update(JSON.stringify(mutation));
	assertPrivate(updated, 200);
	assert(
		(await updated.json()).signals.some(
			(signal: { id: string; status: string }) =>
				signal.id === mutation.id && signal.status === mutation.status,
		),
	);
	assertPrivate(
		await update(JSON.stringify(mutation), { origin: "https://untrusted.example" }),
		403,
	);
	assertPrivate(await update(JSON.stringify(mutation), { "content-type": "text/plain" }), 415);
	assertPrivate(await update("{invalid-json"), 400);
	assertPrivate(await update(JSON.stringify({ ...mutation, extra: "x".repeat(5_000) })), 413);
	const persisted = await request(`${origin}/api/platform/signals`, { headers: { cookie } });
	assert(
		(await persisted.json()).signals.some(
			(signal: { id: string; status: string }) =>
				signal.id === mutation.id && signal.status === mutation.status,
		),
		"Rejected mutations must not change saved state.",
	);
	const signOut = await request(`${origin}/api/auth/sign-out`, {
		method: "POST",
		headers: { cookie, origin, "content-type": "application/json" },
		body: "{}",
	});
	assertPrivate(signOut, 200);
	assertPrivate(await request(`${origin}/api/customers`, { headers: { cookie } }), 401);
	assert.equal((await request(`${origin}/overview`, { method: "POST" })).status, 405);
	assert.equal(await (await request(`${origin}/overview`, { method: "HEAD" })).text(), "");
	console.log(
		"Production smoke passed: assets, caching, auth revocation, viewer/editor/admin permissions, privilege-injection rejection, audited bootstrap and role changes, fresh-session and conflict guards, disabled alternate admin operations, API methods, origins, body limits, and rejected-write integrity.",
	);
} catch (error) {
	child.kill("SIGKILL");
	await child.exited;
	console.error(await output, await errors);
	throw error;
} finally {
	child.kill("SIGKILL");
	await child.exited;
	await Promise.all([output, errors]);
	smokeDatabase?.close();
	for (const suffix of ["", "-wal", "-shm"]) {
		const file = `${databasePath}${suffix}`;
		if (existsSync(file)) rmSync(file);
	}
	rmdirSync(smokeDirectory);
}
