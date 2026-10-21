import { expect, mock, test } from "bun:test";

import { createGracefulShutdown } from "./lifecycle";

test("shutdown drains a real in-flight HTTP response before releasing resources", async () => {
	let beginRequest: () => void = () => {};
	const started = new Promise<void>((resolve) => {
		beginRequest = resolve;
	});
	let finishRequest: () => void = () => {};
	const ready = new Promise<void>((resolve) => {
		finishRequest = resolve;
	});
	const server = Bun.serve({
		port: 0,
		hostname: "127.0.0.1",
		async fetch() {
			beginRequest();
			await ready;
			return new Response("finished safely");
		},
	});
	const closeResources = mock(() => {});
	const shutdown = createGracefulShutdown(server, closeResources, 2000);
	try {
		const response = fetch(server.url, { signal: AbortSignal.timeout(3_000) });
		// Surface connection failure immediately instead of leaving the readiness wait pending.
		await Promise.race([started, response.then(() => {})]);
		const stopped = shutdown();
		expect(shutdown()).toBe(stopped);
		expect(closeResources).not.toHaveBeenCalled();
		finishRequest();
		expect(await (await response).text()).toBe("finished safely");
		await stopped;
		expect(closeResources).toHaveBeenCalledTimes(1);
	} finally {
		finishRequest();
		await server.stop(true);
	}
});

test("shutdown force-closes stuck connections after the deadline and closes resources once", async () => {
	const events: string[] = [];
	const stop = mock(async (force?: boolean) => {
		events.push(force ? "force" : "drain");
		if (!force) await new Promise<void>(() => {});
	});
	const shutdown = createGracefulShutdown(
		{ stop },
		() => {
			events.push("resources");
		},
		10,
	);
	await Promise.all([shutdown(), shutdown()]);
	expect(events).toEqual(["drain", "force", "resources"]);
	expect(stop).toHaveBeenCalledTimes(2);
});

test("shutdown failures remain visible and do not close resources under active requests", async () => {
	const closeResources = mock(() => {});
	const shutdown = createGracefulShutdown(
		{
			stop: async () => {
				throw new Error("drain failed");
			},
		},
		closeResources,
	);
	await expect(shutdown()).rejects.toThrow("drain failed");
	expect(closeResources).not.toHaveBeenCalled();
});
