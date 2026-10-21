import { expect, test } from "bun:test";

import { apiRoute, readJsonBody, validateMutationOrigin } from "./requests";

const origin = "https://studio.example.test";
const jsonRequest = (body: BodyInit | null, headers?: Record<string, string>) =>
	new Request(`${origin}/api/platform/signals`, {
		method: "PATCH",
		body,
		headers: { "content-type": "application/json", ...headers },
	});

test("API methods reject unsupported writes before executing a read handler", async () => {
	let calls = 0;
	const route = apiRoute({
		GET: () => {
			calls += 1;
			return Response.json({ version: 1 }, { headers: { etag: '"v1"' } });
		},
	});
	for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
		const response = await route(new Request(origin, { method }));
		expect(response.status).toBe(405);
		expect(response.headers.get("allow")).toBe("GET, HEAD");
		expect(response.headers.get("cache-control")).toBe("no-store");
	}
	expect(calls).toBe(0);
	const head = await route(new Request(origin, { method: "HEAD" }));
	expect(head.status).toBe(200);
	expect(head.headers.get("etag")).toBe('"v1"');
	expect(await head.text()).toBe("");
	expect(calls).toBe(1);
	const get = await route(new Request(origin));
	expect(await get.json()).toEqual({ version: 1 });
});

test("mutation origins require exact trusted browser evidence", () => {
	const trustedHeaders: Record<string, string>[] = [
		{ origin },
		{ referer: `${origin}/control-room?tab=signals` },
		{ "sec-fetch-site": "same-origin" },
	];
	for (const headers of trustedHeaders) {
		expect(
			validateMutationOrigin(new Request(`${origin}/api/write`, { headers }), origin),
		).toBeNull();
	}
	const untrustedHeaders: Record<string, string>[] = [
		{},
		{ origin: "null" },
		{ origin: `${origin}.attacker.test` },
		{ origin: `${origin}/path` },
		{ origin: "https://untrusted.example.test", "sec-fetch-site": "same-origin" },
		{ referer: "https://untrusted.example.test/control-room" },
		{ referer: "invalid-url" },
		{ "sec-fetch-site": "same-site" },
		{ "sec-fetch-site": "cross-site" },
	];
	for (const headers of untrustedHeaders) {
		const response = validateMutationOrigin(
			new Request(`${origin}/api/write`, { headers }),
			origin,
		);
		expect(response?.status).toBe(403);
		expect(response?.headers.get("cache-control")).toBe("no-store");
	}
	expect(
		validateMutationOrigin(
			new Request("https://untrusted.example.test/api/write", {
				headers: { "sec-fetch-site": "same-origin" },
			}),
			origin,
		)?.status,
	).toBe(403);
});

test("JSON commands require JSON content types and valid UTF-8 payloads", async () => {
	for (const contentType of ["application/json", "application/vnd.studio+json; charset=utf-8"]) {
		expect(
			await readJsonBody(jsonRequest('{"id":"ready"}', { "content-type": contentType }), 64),
		).toEqual({ ok: true, value: { id: "ready" } });
	}
	for (const contentType of ["text/plain", "application/x-www-form-urlencoded", "text/json"]) {
		const result = await readJsonBody(jsonRequest("{}", { "content-type": contentType }), 64);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.response.status).toBe(415);
	}
	for (const body of [null, "{broken", new Uint8Array([0xff])]) {
		const result = await readJsonBody(jsonRequest(body), 64);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.response.status).toBe(400);
	}
});

test("JSON body budgets reject declared, streamed, and multibyte overflows", async () => {
	let cancelled = false;
	const streamed = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(new TextEncoder().encode('{"value":"'));
			controller.enqueue(new TextEncoder().encode("x".repeat(100)));
		},
		cancel() {
			cancelled = true;
		},
	});
	for (const request of [
		jsonRequest("{}", { "content-length": "1000" }),
		jsonRequest(streamed, { "content-length": "1" }),
		jsonRequest(JSON.stringify("💜".repeat(20))),
	]) {
		const result = await readJsonBody(request, 32);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.response.status).toBe(413);
	}
	expect(cancelled).toBe(true);
});
