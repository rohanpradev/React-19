import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createProductionAppHandler } from "./static";

const directory = await mkdtemp(path.join(tmpdir(), "react-static-"));
const handler = createProductionAppHandler(path.join(directory, "public"));
const request = (pathname: string, method = "GET") =>
	handler(new Request(`http://localhost${pathname}`, { method }));

beforeAll(async () => {
	await Bun.write(path.join(directory, "index.js"), "private server code");
	await Bun.write(path.join(directory, "public/index.html"), "<!doctype html><h1>App</h1>");
	await Bun.write(path.join(directory, "public/app-abcd1234.js"), "console.log('browser')");
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

test("HEAD has no body, unsupported methods are rejected, malformed escapes return 400", async () => {
	expect(await (await request("/overview", "HEAD")).text()).toBe("");
	const rejected = await request("/overview", "POST");
	expect(rejected.status).toBe(405);
	expect(rejected.headers.get("allow")).toBe("GET, HEAD");
	expect((await request("/%ZZ")).status).toBe(400);
});
