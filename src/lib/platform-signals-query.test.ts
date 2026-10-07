import { afterEach, expect, spyOn, test } from "bun:test";

import {
	isCancelledError,
	MutationObserver,
	QueryClient,
	QueryObserver,
} from "@tanstack/react-query";

import {
	createPlatformSignalsResponse,
	type PlatformSignalsResponse,
} from "@/lib/platform-signals";
import {
	platformSignalMutationOptions,
	platformSignalsQueryOptions,
} from "@/lib/platform-signals-query";

const initial = createPlatformSignalsResponse([
	{
		id: "test-signal",
		title: "Test signal",
		owner: "Test owner",
		detail: "Original server value",
		status: "ready",
		confidence: 90,
		updatedAt: 1,
	},
]);
const confirmed = createPlatformSignalsResponse(
	initial.signals.map((signal) => ({ ...signal, status: "watch", updatedAt: 2 })),
);
const { queryKey } = platformSignalsQueryOptions;
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, "fetch">>;
let unsubscribe: (() => void) | undefined;

function mockFetch(
	implementation: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>,
) {
	fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
		Object.assign(implementation, { preconnect: fetch.preconnect }),
	);
}

afterEach(() => {
	unsubscribe?.();
	unsubscribe = undefined;
	queryClient.clear();
	fetchSpy?.mockRestore();
});

test("cancelling a query aborts its network request", async () => {
	const started = Promise.withResolvers<AbortSignal>();
	mockFetch((_input, init) => {
		const signal = init?.signal;
		if (!signal) throw new Error("The request needs an AbortSignal.");
		started.resolve(signal);
		return new Promise((_resolve, reject) => {
			signal.addEventListener("abort", () => reject(signal.reason), { once: true });
		});
	});
	const request = queryClient.fetchQuery(platformSignalsQueryOptions).catch((error) => error);
	const signal = await started.promise;
	await queryClient.cancelQueries({ queryKey });

	expect(signal.aborted).toBe(true);
	expect(isCancelledError(await request)).toBe(true);
	expect(queryClient.getQueryData(queryKey)).toBeUndefined();
});

test("a failed mutation restores the complete previous cache snapshot", async () => {
	queryClient.setQueryData(queryKey, initial);
	const started = Promise.withResolvers<void>();
	const response = Promise.withResolvers<Response>();
	mockFetch(() => {
		started.resolve();
		return response.promise;
	});
	const mutation = new MutationObserver(queryClient, platformSignalMutationOptions(queryClient));
	const result = mutation.mutate({ id: "test-signal", status: "watch" }).catch((error) => error);
	await started.promise;
	expect(queryClient.getQueryData(queryKey)?.summary.watch).toBe(1);

	response.resolve(new Response(null, { status: 500 }));
	expect(await result).toBeInstanceOf(Error);
	expect(mutation.getCurrentResult().isError).toBe(true);
	expect(queryClient.getQueryData<PlatformSignalsResponse>(queryKey)).toEqual(initial);
});

test("a mutation stays pending until the active query has refreshed", async () => {
	queryClient.setQueryData(queryKey, initial);
	const refreshed = Promise.withResolvers<Response>();
	const refreshing = Promise.withResolvers<void>();
	mockFetch(async (_input, init) => {
		if (init?.method === "PATCH") return Response.json(confirmed);
		refreshing.resolve();
		return refreshed.promise;
	});
	const query = new QueryObserver(queryClient, platformSignalsQueryOptions);
	unsubscribe = query.subscribe(() => {});
	const mutation = new MutationObserver(queryClient, platformSignalMutationOptions(queryClient));
	const result = mutation.mutate({ id: "test-signal", status: "watch" });
	await refreshing.promise;

	expect(mutation.getCurrentResult().isPending).toBe(true);
	refreshed.resolve(Response.json(confirmed));
	await result;
	expect(mutation.getCurrentResult().isPending).toBe(false);
	expect(queryClient.getQueryData<PlatformSignalsResponse>(queryKey)).toEqual(confirmed);
});

test("successful writes reconcile inactive caches with the complete server response", async () => {
	queryClient.setQueryData(queryKey, initial);
	const serverResponse = createPlatformSignalsResponse(
		confirmed.signals.map((signal) => ({ ...signal, confidence: 42 })),
	);
	mockFetch(async () => Response.json(serverResponse));
	const mutation = new MutationObserver(queryClient, platformSignalMutationOptions(queryClient));
	await mutation.mutate({ id: "test-signal", status: "watch" });
	expect(queryClient.getQueryData<PlatformSignalsResponse>(queryKey)).toEqual(serverResponse);
});

test("a failed refresh does not erase a successful server-confirmed write", async () => {
	queryClient.setQueryData(queryKey, initial);
	mockFetch(async (_input, init) =>
		init?.method === "PATCH" ? Response.json(confirmed) : new Response(null, { status: 503 }),
	);
	const query = new QueryObserver(queryClient, platformSignalsQueryOptions);
	unsubscribe = query.subscribe(() => {});
	const mutation = new MutationObserver(queryClient, platformSignalMutationOptions(queryClient));
	await mutation.mutate({ id: "test-signal", status: "watch" });
	expect(mutation.getCurrentResult().isSuccess).toBe(true);
	expect(queryClient.getQueryData<PlatformSignalsResponse>(queryKey)).toEqual(confirmed);
	expect(query.getCurrentResult().isRefetchError).toBe(true);
});
