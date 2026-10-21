import { QueryClient } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/lib/api-client";

export function createSessionQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: shouldRetryQuery, staleTime: 10_000 },
			// Writes require an explicit retry so a lost response cannot duplicate a side effect.
			mutations: { retry: false },
		},
	});
}
