import { expect, test } from "bun:test";

import { privateJson, privateResponse } from "./responses";

test("private responses preserve the status, body, and separate authentication cookies", async () => {
	const headers = new Headers({ "cache-control": "public, max-age=3600" });
	headers.append("set-cookie", "session_token=token; HttpOnly; Path=/");
	headers.append("set-cookie", "session_data=data; HttpOnly; Path=/");
	const response = privateResponse(new Response("signed in", { status: 201, headers }));
	expect(response.status).toBe(201);
	expect(await response.text()).toBe("signed in");
	expect(response.headers.get("cache-control")).toBe("no-store");
	expect(response.headers.get("x-content-type-options")).toBe("nosniff");
	expect(response.headers.getSetCookie()).toEqual(headers.getSetCookie());
});

test("JSON errors and successes are never cacheable", async () => {
	for (const status of [200, 400, 401, 403, 404, 500]) {
		const response = privateJson({ status }, { status });
		expect(response.status).toBe(status);
		expect(response.headers.get("cache-control")).toBe("no-store");
		expect(response.headers.get("content-type")).toContain("application/json");
		expect(await response.json()).toEqual({ status });
	}
});
