import { redirectToAuth } from "@/auth/redirects";

export const accessDeniedEvent = "workspace:access-denied";

const apiErrorMessages = {
	forbidden: "Your current role does not allow this action.",
	reauthentication_required: "Sign out and sign in again before changing access.",
	role_conflict:
		"This person's role changed while you were editing. Review the refreshed list before saving again.",
	last_admin: "The workspace must retain an active administrator.",
	self_role_change: "Ask another administrator to change your role.",
	user_not_found: "This account no longer exists. Refresh the list to continue.",
	invalid_stored_role: "This account's role needs repair by the workspace operator.",
} as const;

type ApiErrorCode = keyof typeof apiErrorMessages;

/** Preserve the status so callers can distinguish permanent failures from transient ones. */
export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		readonly code?: ApiErrorCode,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	if (!headers.has("accept")) headers.set("accept", "application/json");
	const response = await fetch(url, { ...init, headers });

	// A cancelled request must never redirect a newer session or commit stale results.
	init.signal?.throwIfAborted();
	if (response.status === 401) {
		redirectToAuth();
		throw new ApiError(401, "Your session has expired. Sign in to continue.");
	}
	if (!response.ok) {
		// Show only known, locally defined messages. Arbitrary server bodies stay private.
		const code = await readErrorCode(response);
		init.signal?.throwIfAborted();
		if (response.status === 403 && typeof window !== "undefined") {
			// Reconcile role changes without redirecting a still-authenticated account.
			window.dispatchEvent(new Event(accessDeniedEvent));
		}
		throw new ApiError(
			response.status,
			code
				? apiErrorMessages[code]
				: response.status === 403
					? apiErrorMessages.forbidden
					: `The request failed (${response.status}). Please try again.`,
			code,
		);
	}

	const data = (await response.json()) as T;
	init.signal?.throwIfAborted();
	return data;
}

async function readErrorCode(response: Response): Promise<ApiErrorCode | undefined> {
	try {
		const body: unknown = await response.json();
		if (!body || typeof body !== "object" || !("code" in body)) return undefined;
		return typeof body.code === "string" && Object.hasOwn(apiErrorMessages, body.code)
			? (body.code as ApiErrorCode)
			: undefined;
	} catch {
		return undefined;
	}
}

/** Read requests may retry once; authentication, validation and cancellation cannot recover that way. */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
	if (failureCount >= 1) return false;
	if (error instanceof SyntaxError) return false;
	if (error instanceof Error && error.name === "AbortError") return false;
	if (error instanceof ApiError) {
		return error.status === 408 || error.status === 429 || error.status >= 500;
	}
	return true;
}
