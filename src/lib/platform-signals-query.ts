import { mutationOptions, type QueryClient, queryOptions } from "@tanstack/react-query";

import { requestJson } from "@/lib/api-client";
import {
	type PlatformSignalsResponse,
	summarizePlatformSignals,
	type UpdatePlatformSignalRequest,
} from "@/lib/platform-signals";

export const platformSignalsQueryOptions = queryOptions({
	queryKey: ["platform-signals"],
	queryFn: ({ signal }) => requestPlatformSignals({ signal }),
	staleTime: 20_000,
});

export function platformSignalMutationOptions(queryClient: QueryClient) {
	const { queryKey } = platformSignalsQueryOptions;

	return mutationOptions({
		mutationFn: (request: UpdatePlatformSignalRequest) =>
			requestPlatformSignals({
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(request),
			}),
		onMutate: async (request) => {
			await queryClient.cancelQueries({ queryKey });
			const previous = queryClient.getQueryData(queryKey);

			queryClient.setQueryData(queryKey, (current) => {
				if (!current) return current;
				const signals = current.signals.map((signal) =>
					signal.id === request.id
						? { ...signal, status: request.status, updatedAt: Date.now() }
						: signal,
				);
				return { signals, summary: summarizePlatformSignals(signals) };
			});

			return { previous };
		},
		onError: (_error, _request, context) => {
			if (context?.previous) {
				queryClient.setQueryData(queryKey, context.previous);
			}
		},
		// Preserve the confirmed write even if the subsequent refresh fails or is inactive.
		onSuccess: (data) => queryClient.setQueryData(queryKey, data),
		// Keep the mutation pending until active queries reconcile with the server.
		onSettled: () => queryClient.invalidateQueries({ queryKey }),
	});
}

async function requestPlatformSignals(init: RequestInit): Promise<PlatformSignalsResponse> {
	return requestJson<PlatformSignalsResponse>("/api/platform/signals", init);
}
