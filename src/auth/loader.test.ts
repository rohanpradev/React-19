import { afterAll, afterEach, expect, spyOn, test } from "bun:test";

import { createMemoryRouter } from "react-router";

// Better Auth captures fetch when its client is constructed.
const fetchSpy = spyOn(globalThis, "fetch");
const { rootLoader } = await import("@/auth/loader");
let router: ReturnType<typeof createMemoryRouter> | undefined;

afterEach(() => {
	router?.dispose();
	router = undefined;
	fetchSpy.mockReset();
});

afterAll(() => fetchSpy.mockRestore());

test("a signed-out session remains a successful loader result", async () => {
	fetchSpy.mockResolvedValue(Response.json(null));
	router = createMemoryRouter([{ id: "root", path: "/", loader: rootLoader }]);
	await waitForInitialization(router);
	expect(router.state.loaderData["root"]).toEqual({ session: null });
});

test("session-service failures reach the router error boundary", async () => {
	fetchSpy.mockResolvedValue(Response.json({ message: "Service unavailable" }, { status: 503 }));
	router = createMemoryRouter([{ id: "root", path: "/", loader: rootLoader }]);
	await waitForInitialization(router);
	expect(router.state.errors?.["root"]).toMatchObject({
		status: 503,
		statusText: "Session unavailable",
	});
});

async function waitForInitialization(router: ReturnType<typeof createMemoryRouter>) {
	const initialized = Promise.withResolvers<void>();
	const unsubscribe = router.subscribe((state) => {
		if (state.initialized) initialized.resolve();
	});
	if (router.state.initialized) initialized.resolve();
	await initialized.promise;
	unsubscribe();
}
