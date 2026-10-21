import { expect, test } from "bun:test";

import { listPlatformSignals, updatePlatformSignal } from "./platform-signals";

const request = (body: string, contentType = "application/json") =>
	new Request("https://studio.example.test/api/platform/signals", {
		method: "PATCH",
		headers: { "content-type": contentType },
		body,
	});

test("signal writes validate before changing state", async () => {
	const before = listPlatformSignals();
	for (const [body, contentType, status] of [
		["not-json", "application/json", 400],
		['{"id":"compiler-readiness","status":"unknown"}', "application/json", 400],
		['{"id":"missing","status":"ready"}', "application/json", 404],
		['{"id":"compiler-readiness","status":"ready"}', "text/plain", 415],
		[
			JSON.stringify({ id: "compiler-readiness", status: "ready", extra: "x".repeat(4096) }),
			"application/json",
			413,
		],
	] as const) {
		expect((await updatePlatformSignal(request(body, contentType))).status).toBe(status);
	}
	expect(listPlatformSignals()).toEqual(before);
	const response = await updatePlatformSignal(
		request('{"id":"compiler-readiness","status":"ready"}'),
	);
	expect(response.status).toBe(200);
	const signal = (await response.json()).signals.find(
		(entry: { id: string }) => entry.id === "compiler-readiness",
	);
	expect(signal.status).toBe("ready");
	expect(signal.confidence).toBe(77);
});
