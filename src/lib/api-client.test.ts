import { afterEach, expect, spyOn, test } from "bun:test";

import { ApiError, accessDeniedEvent, requestJson, shouldRetryQuery } from "@/lib/api-client";
import { createSessionQueryClient } from "@/lib/query-client";

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;

function mockFetch(
	implementation: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>,
) {
	fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
		Object.assign(implementation, { preconnect: fetch.preconnect }),
	);
}

afterEach(() => fetchSpy?.mockRestore());

test("JSON requests retain cancellation and caller headers", async () => {
	const controller = new AbortController();
	mockFetch(async (_url, init) => {
		expect(init?.signal).toBe(controller.signal);
		const headers = new Headers(init?.headers);
		expect(headers.get("accept")).toBe("application/json");
		expect(headers.get("content-type")).toBe("application/json");
		return Response.json({ saved: true });
	});
	expect(
		await requestJson("/api/example", {
			signal: controller.signal,
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: "{}",
		}),
	).toEqual({ saved: true });
});

test("cancelled requests cannot commit late responses even if fetch has already resolved", async () => {
	const controller = new AbortController();
	mockFetch(async () => {
		controller.abort();
		return Response.json({ stale: true });
	});
	await expect(requestJson("/api/example", { signal: controller.signal })).rejects.toMatchObject({
		name: "AbortError",
	});
});

test("HTTP failures preserve status without exposing arbitrary response bodies", async () => {
	mockFetch(async () => new Response("Private server detail", { status: 403 }));
	await expect(requestJson("/api/example")).rejects.toMatchObject({
		status: 403,
		name: "ApiError",
	});
});

test("access failures show known messages without trusting arbitrary server text", async () => {
	mockFetch(async () =>
		Response.json({ code: "role_conflict", error: "Private server detail" }, { status: 409 }),
	);
	await expect(requestJson("/api/access/roles")).rejects.toMatchObject({
		status: 409,
		code: "role_conflict",
		message:
			"This person's role changed while you were editing. Review the refreshed list before saving again.",
	});

	fetchSpy.mockRestore();
	mockFetch(async () =>
		Response.json(
			{ code: "unknown_private_code", error: "Private server detail" },
			{ status: 409 },
		),
	);
	await expect(requestJson("/api/access/roles")).rejects.toMatchObject({
		status: 409,
		code: undefined,
		message: "The request failed (409). Please try again.",
	});
});

test("forbidden responses request session reconciliation without navigating the account", async () => {
	const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
	const browser = new EventTarget();
	let reconciliations = 0;
	browser.addEventListener(accessDeniedEvent, () => {
		reconciliations += 1;
	});
	Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
	mockFetch(async () => Response.json({ code: "reauthentication_required" }, { status: 403 }));
	try {
		await expect(requestJson("/api/access/roles")).rejects.toMatchObject({
			status: 403,
			code: "reauthentication_required",
			message: "Sign out and sign in again before changing access.",
		});
		expect(reconciliations).toBe(1);
	} finally {
		if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
		else Reflect.deleteProperty(globalThis, "window");
	}
});

test("permanent failures and cancellations never retry", () => {
	for (const status of [400, 401, 403, 404, 409, 422]) {
		expect(shouldRetryQuery(0, new ApiError(status, "Request failed"))).toBe(false);
	}
	expect(shouldRetryQuery(0, new DOMException("Aborted", "AbortError"))).toBe(false);
	expect(shouldRetryQuery(0, new SyntaxError("Invalid JSON"))).toBe(false);
});

test("transient read failures retry once with the session query policy", async () => {
	const client = createSessionQueryClient();
	let attempts = 0;
	mockFetch(async () => {
		attempts += 1;
		return attempts === 1 ? new Response(null, { status: 503 }) : Response.json({ ready: true });
	});
	try {
		const data = await client.fetchQuery({
			queryKey: ["recovery"],
			queryFn: () => requestJson("/api/example"),
			retryDelay: 0,
		});
		expect(data).toEqual({ ready: true });
		expect(attempts).toBe(2);
	} finally {
		client.clear();
	}
});

test("a forbidden request fails immediately without a repeated network request", async () => {
	const client = createSessionQueryClient();
	let attempts = 0;
	mockFetch(async () => {
		attempts += 1;
		return new Response(null, { status: 403 });
	});
	try {
		await expect(
			client.fetchQuery({
				queryKey: ["forbidden"],
				queryFn: () => requestJson("/api/example"),
				retryDelay: 0,
			}),
		).rejects.toBeInstanceOf(ApiError);
		expect(attempts).toBe(1);
	} finally {
		client.clear();
	}
});

test("a new session cannot read the previous session's query cache", () => {
	const previous = createSessionQueryClient();
	const next = createSessionQueryClient();
	try {
		previous.setQueryData(["private"], { owner: "previous session" });
		expect(next.getQueryData(["private"])).toBeUndefined();
	} finally {
		previous.clear();
		next.clear();
	}
});
