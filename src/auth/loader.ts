import type { LoaderFunctionArgs } from "react-router";

import { authClient } from "@/auth/client";

export async function rootLoader({ request }: LoaderFunctionArgs) {
	const { data: session, error } = await authClient.getSession({
		fetchOptions: { signal: request.signal },
	});

	if (error) {
		throw new Response("Unable to load your session. Please try again.", {
			status: 503,
			statusText: "Session unavailable",
		});
	}

	return { session };
}
