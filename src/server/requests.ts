import { privateJson } from "./responses";

// This workspace accepts small JSON commands. File previews stay in the browser.
export const MAX_REQUEST_BODY_BYTES = 64 * 1024;
export const MAX_SIGNAL_BODY_BYTES = 4 * 1024;

type ApiHandler = (request: Request) => Response | Promise<Response>;
type ApiMethods = Partial<Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE", ApiHandler>>;

/** Apply the same method contract in Bun routing and direct handler tests. */
export function apiRoute(methods: ApiMethods): ApiHandler {
	const allowedMethods = Object.keys(methods).flatMap((method) =>
		method === "GET" ? ["GET", "HEAD"] : [method],
	);
	return async (request) => {
		const method = request.method === "HEAD" ? "GET" : request.method;
		const handler = Object.hasOwn(methods, method)
			? methods[method as keyof ApiMethods]
			: undefined;
		if (!handler) {
			return privateJson(
				{ error: "Method not allowed." },
				{ status: 405, headers: { allow: allowedMethods.join(", ") } },
			);
		}
		const response = await handler(request);
		return request.method === "HEAD" ? new Response(null, response) : response;
	};
}

/** Cookie-authenticated writes require a browser origin we can verify. */
export function validateMutationOrigin(request: Request, canonicalOrigin: string) {
	const origin = request.headers.get("origin");
	let trusted = origin === canonicalOrigin;
	if (origin === null) {
		const referer = request.headers.get("referer");
		if (referer) {
			try {
				trusted = new URL(referer).origin === canonicalOrigin;
			} catch {
				trusted = false;
			}
		} else {
			trusted =
				request.headers.get("sec-fetch-site") === "same-origin" &&
				new URL(request.url).origin === canonicalOrigin;
		}
	}
	return trusted
		? null
		: privateJson({ error: "A trusted request origin is required." }, { status: 403 });
}

type JsonBodyResult = { ok: true; value: unknown } | { ok: false; response: Response };

/** Bound actual streamed bytes as well as Content-Length before parsing JSON. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
	const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
	if (!mediaType || !/^application\/(?:[a-z0-9!#$&^_.+-]+\+)?json$/.test(mediaType)) {
		return {
			ok: false,
			response: privateJson({ error: "Content-Type must be application/json." }, { status: 415 }),
		};
	}
	const declaredLength = request.headers.get("content-length");
	if (declaredLength !== null && Number(declaredLength) > maxBytes) {
		return { ok: false, response: payloadTooLarge() };
	}
	const reader = request.body?.getReader();
	if (!reader) return { ok: false, response: invalidJson() };
	const chunks: Uint8Array[] = [];
	let length = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			length += value.byteLength;
			if (length > maxBytes) {
				// Cancellation is best effort; do not wait for an uncooperative producer.
				void reader.cancel().catch(() => {});
				return { ok: false, response: payloadTooLarge() };
			}
			chunks.push(value);
		}
		const bytes = new Uint8Array(length);
		let offset = 0;
		for (const chunk of chunks) {
			bytes.set(chunk, offset);
			offset += chunk.byteLength;
		}
		return { ok: true, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) };
	} catch {
		return { ok: false, response: invalidJson() };
	} finally {
		reader.releaseLock();
	}
}

function payloadTooLarge() {
	return privateJson({ error: "Request body is too large." }, { status: 413 });
}

function invalidJson() {
	return privateJson({ error: "A valid JSON body is required." }, { status: 400 });
}
