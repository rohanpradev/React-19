import assert from "node:assert/strict";
import path from "node:path";

// Exercise the actual build with disposable data and no developer credentials.
const projectRoot = path.resolve(import.meta.dir, "..");
const probe = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
const port = probe.port;
probe.stop(true);
const origin = `http://127.0.0.1:${port}`;
const child = Bun.spawn([process.execPath, "--no-env-file", "dist/index.js"], {
	cwd: projectRoot,
	env: {
		PATH: process.env["PATH"],
		SystemRoot: process.env["SystemRoot"],
		NODE_ENV: "production",
		PORT: String(port),
		DB_FILE_NAME: ":memory:",
		BETTER_AUTH_URL: origin,
		BETTER_AUTH_SECRET: crypto.randomUUID() + crypto.randomUUID(),
	},
	stdout: "pipe",
	stderr: "pipe",
});
const output = new Response(child.stdout).text();
const errors = new Response(child.stderr).text();

try {
	let ready = false;
	let readinessError = "No response";
	for (let attempt = 0; attempt < 100; attempt++) {
		if (child.exitCode !== null) throw new Error(`Production server exited: ${await errors}`);
		try {
			const response = await fetch(`${origin}/api/platform/health`, {
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

	const document = await fetch(`${origin}/nested/deep-link`);
	assert.equal(document.status, 200);
	assert.equal(document.headers.get("cache-control"), "no-cache");
	const html = await document.text();
	const assets = [...html.matchAll(/(?:src|href)="(\/(?:chunk|favicon)-[^"]+)"/g)].map(
		(match) => match[1],
	);
	assert(
		assets.length >= 3,
		"HTML must reference root-relative script, stylesheet, and icon assets.",
	);
	for (const asset of assets) {
		const response = await fetch(`${origin}${asset}`);
		assert.equal(response.status, 200, asset);
		assert.match(response.headers.get("cache-control") ?? "", /immutable/);
	}
	for (const pathname of ["/index.js", "/missing.js", "/api/unknown", "/.env", "/..%5cindex.js"]) {
		assert.equal((await fetch(`${origin}${pathname}`)).status, 404, pathname);
	}
	assert.equal((await fetch(`${origin}/api/customers`)).status, 401);
	assert.equal((await fetch(`${origin}/overview`, { method: "POST" })).status, 405);
	assert.equal(await (await fetch(`${origin}/overview`, { method: "HEAD" })).text(), "");
	console.log(
		"Production smoke passed: deep links, browser assets, private-file isolation, API auth, and HTTP methods.",
	);
} catch (error) {
	child.kill();
	await child.exited;
	console.error(await output, await errors);
	throw error;
} finally {
	child.kill();
	await child.exited;
	await Promise.all([output, errors]);
}
