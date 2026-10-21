import {
	createPlatformSignalsResponse,
	isPlatformSignalStatus,
	type PlatformSignal,
	type UpdatePlatformSignalRequest,
} from "@/lib/platform-signals";

import { MAX_SIGNAL_BODY_BYTES, readJsonBody } from "./requests";

let platformSignals: PlatformSignal[] = [
	{
		id: "compiler-readiness",
		title: "React Compiler readiness",
		owner: "Frontend Platform",
		detail:
			"Audit component purity, memoization assumptions, and unsupported syntax before piloting.",
		status: "watch",
		confidence: 72,
		updatedAt: Date.now() - 1000 * 60 * 28,
	},
	{
		id: "router-actions",
		title: "Router action mutation boundary",
		owner: "Product Infrastructure",
		detail:
			"Move route-owned mutations toward actions or fetchers when automatic revalidation matters.",
		status: "ready",
		confidence: 88,
		updatedAt: Date.now() - 1000 * 60 * 45,
	},
	{
		id: "query-cache",
		title: "Server-state cache policy",
		owner: "Data Experience",
		detail:
			"Use query keys, optimistic updates, and invalidation for API-backed collaborative views.",
		status: "ready",
		confidence: 91,
		updatedAt: Date.now() - 1000 * 60 * 9,
	},
	{
		id: "drizzle-safety",
		title: "Drizzle destructive write guard",
		owner: "Runtime Platform",
		detail: "Enable Biome Drizzle rules for update and delete calls that forget a where clause.",
		status: "risk",
		confidence: 64,
		updatedAt: Date.now() - 1000 * 60 * 73,
	},
];

export function listPlatformSignals() {
	return createPlatformSignalsResponse(platformSignals);
}

export async function updatePlatformSignal(
	request: Request,
	authorizeCommit?: () => Response | null,
) {
	const body = await readJsonBody(request, MAX_SIGNAL_BODY_BYTES);
	if (!body.ok) return body.response;
	const payload = readUpdatePayload(body.value);

	if (!payload) {
		return new Response("Invalid platform signal payload.", { status: 400 });
	}

	const signalIndex = platformSignals.findIndex((signal) => signal.id === payload.id);

	if (signalIndex < 0) {
		return new Response("Platform signal not found.", { status: 404 });
	}
	// Body reads can outlive a role change or session revocation. Recheck immediately before writing.
	const authorizationError = authorizeCommit?.();
	if (authorizationError) return authorizationError;

	platformSignals = platformSignals.map((signal, index) =>
		index === signalIndex
			? {
					...signal,
					status: payload.status,
					confidence: nextConfidence(signal.confidence, payload.status),
					updatedAt: Date.now(),
				}
			: signal,
	);

	return Response.json(listPlatformSignals());
}

function readUpdatePayload(body: unknown): UpdatePlatformSignalRequest | null {
	if (!isRecord(body) || typeof body["id"] !== "string" || typeof body["status"] !== "string") {
		return null;
	}

	if (!isPlatformSignalStatus(body["status"])) {
		return null;
	}

	return {
		id: body["id"],
		status: body["status"],
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nextConfidence(current: number, status: PlatformSignal["status"]) {
	const delta = status === "ready" ? 5 : status === "watch" ? -2 : -8;
	return Math.min(Math.max(current + delta, 30), 99);
}
