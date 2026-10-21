import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm, stat, utimes } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createProductionAppHandler } from "./static";

const directory = await mkdtemp(path.join(tmpdir(), "react-static-"));
const handler = createProductionAppHandler(
	path.join(directory, "public"),
	new Set(["/app-abcd1234.js"]),
);
const request = (pathname: string, method = "GET", headers?: HeadersInit) =>
	handler(new Request(`http://localhost${pathname}`, { method, headers }));

beforeAll(async () => {
	await Bun.write(path.join(directory, "index.js"), "private server code");
	await Bun.write(path.join(directory, "public/index.html"), "<!doctype html><h1>App</h1>");
	await Bun.write(path.join(directory, "public/app-abcd1234.js"), "console.log('browser')");
	await Bun.write(path.join(directory, "public/manifest.json"), '{"version":1}');
	await Bun.write(path.join(directory, "public/release-abcdefgh.js"), "console.log('release')");
});

afterAll(async () => {
	if (path.dirname(directory) !== path.resolve(tmpdir())) throw new Error("Unsafe fixture path");
	await rm(directory, { recursive: true, force: true });
});

test("server output, private paths, unknown APIs, and missing assets are not served", async () => {
	for (const pathname of [
		"/index.js",
		"/missing.js",
		"/api/unknown",
		"/api",
		"/.env",
		"/..%5cindex.js",
		"/%2e%2e%2findex.js",
		"/index.html:secret",
	]) {
		const response = await request(pathname);
		expect(response.status).toBe(404);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(await response.text()).not.toContain("private server code");
	}
});

test("deep links get revalidated HTML and browser assets get immutable caching", async () => {
	const document = await request("/unknown-route");
	expect(document.status).toBe(200);
	expect(document.headers.get("cache-control")).toBe("no-cache");
	expect(await document.text()).toContain("<h1>App</h1>");
	const asset = await request("/app-abcd1234.js");
	expect(asset.headers.get("cache-control")).toContain("immutable");
	expect(asset.headers.get("content-type")).toContain("javascript");
	expect(asset.headers.get("x-content-type-options")).toBe("nosniff");
});

test("immutable caching requires an explicit build asset entry", async () => {
	const release = await request("/release-abcdefgh.js");
	expect(release.headers.get("cache-control")).toBe("no-cache");
	expect(release.headers.get("etag")).toBeTruthy();
	const withoutManifest = createProductionAppHandler(path.join(directory, "public"));
	const asset = await withoutManifest(new Request("http://localhost/app-abcd1234.js"));
	expect(asset.headers.get("cache-control")).toBe("no-cache");
});

test("stable assets revalidate, including same-size changes with a preserved modification time", async () => {
	const manifestPath = path.join(directory, "public/manifest.json");
	const metadata = await stat(manifestPath);
	const original = await request("/manifest.json");
	const entityTag = original.headers.get("etag");
	expect(original.headers.get("cache-control")).toBe("no-cache");
	expect(entityTag).toMatch(/^"[a-f0-9]{64}"$/);

	await Bun.write(manifestPath, '{"version":2}');
	await utimes(manifestPath, metadata.atime, metadata.mtime);
	const changed = await request("/manifest.json", "GET", { "if-none-match": entityTag ?? "" });
	expect(changed.status).toBe(200);
	expect(changed.headers.get("etag")).not.toBe(entityTag);
	expect(await changed.json()).toEqual({ version: 2 });
});

test("documents support weak, list, and wildcard cache validators without response bodies", async () => {
	const original = await request("/overview");
	const entityTag = original.headers.get("etag");
	expect(entityTag).toBeTruthy();

	for (const method of ["GET", "HEAD"]) {
		for (const validator of [entityTag, `W/${entityTag}`, `"stale", W/${entityTag}`, "*"]) {
			const response = await request("/overview", method, { "if-none-match": validator ?? "" });
			expect(response.status).toBe(304);
			expect(response.headers.get("etag")).toBe(entityTag);
			expect(response.headers.get("cache-control")).toBe("no-cache");
			expect(await response.text()).toBe("");
		}
	}
	const stale = await request("/overview", "GET", { "if-none-match": '"stale"' });
	expect(stale.status).toBe(200);
	expect(await stale.text()).toContain("<h1>App</h1>");
	const quotedWildcard = await request("/overview", "GET", {
		"if-none-match": '",*,", "stale"',
	});
	expect(quotedWildcard.status).toBe(200);
	// A matching wildcard does not turn a missing file into a successful response.
	expect((await request("/missing.js", "GET", { "if-none-match": "*" })).status).toBe(404);
});

test("HEAD has no body, unsupported methods are rejected, malformed escapes return 400", async () => {
	const document = await request("/overview");
	const head = await request("/overview", "HEAD");
	expect(await head.text()).toBe("");
	expect(head.headers.get("content-length")).toBe(document.headers.get("content-length"));
	expect(head.headers.get("etag")).toBe(document.headers.get("etag"));
	const rejected = await request("/overview", "POST");
	expect(rejected.status).toBe(405);
	expect(rejected.headers.get("allow")).toBe("GET, HEAD");
	expect((await request("/%ZZ")).status).toBe(400);
});
