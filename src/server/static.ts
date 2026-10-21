import path from "node:path";

function errorResponse(message: string, status: number, headers?: Record<string, string>) {
	return new Response(message, {
		status,
		headers: { "cache-control": "no-store", "x-content-type-options": "nosniff", ...headers },
	});
}

function matchesEntityTag(value: string | null, entityTag: string) {
	if (value?.trim() === "*") return true;
	// Opaque tags may contain commas. Match complete quoted tags before comparing;
	// a comma or asterisk inside a tag is never a list separator or wildcard.
	return value
		?.match(/(?:W\/)?"[^"]*"/g)
		?.some((candidate) => candidate.replace(/^W\//, "") === entityTag);
}

/** Only the browser build belongs in this directory; server output is its sibling. */
export function createProductionAppHandler(
	publicDirectory: string,
	immutableAssets: ReadonlySet<string> = new Set(),
) {
	const publicRoot = path.resolve(publicDirectory);
	return async (request: Request) => {
		if (request.method !== "GET" && request.method !== "HEAD") {
			return errorResponse("Method Not Allowed", 405, { allow: "GET, HEAD" });
		}

		let pathname: string;
		try {
			pathname = decodeURIComponent(new URL(request.url).pathname);
		} catch {
			return errorResponse("Bad Request", 400);
		}
		// Reject platform-specific separators, dotfiles, and traversal before resolving.
		if (/[\\\0:]/.test(pathname) || pathname.split("/").some((part) => part.startsWith("."))) {
			return errorResponse("Not Found", 404);
		}
		if (pathname === "/api" || pathname.startsWith("/api/")) {
			return Response.json(
				{ error: "Not found." },
				{ status: 404, headers: { "cache-control": "no-store" } },
			);
		}

		const resolvedPath = path.resolve(publicRoot, pathname.replace(/^\/+/, "") || "index.html");
		const relative = path.relative(publicRoot, resolvedPath);
		if (relative.startsWith("..") || path.isAbsolute(relative)) {
			return errorResponse("Not Found", 404);
		}
		let file = Bun.file(resolvedPath);
		let isDocument = path.extname(resolvedPath).toLowerCase() === ".html";
		if (!(await file.exists())) {
			// Missing assets must not be cached as successful HTML responses.
			if (path.extname(pathname)) return errorResponse("Not Found", 404);
			file = Bun.file(path.join(publicRoot, "index.html"));
			isDocument = true;
			if (!(await file.exists())) {
				return errorResponse("Production build not found.", 503);
			}
		}
		// Only the build manifest can establish content-versioned assets. A stable
		// filename that resembles a hash must still revalidate after deployments.
		const isImmutableAsset = !isDocument && immutableAssets.has(pathname);
		const headers = new Headers({
			"content-type": file.type,
			"cache-control": isImmutableAsset ? "public, max-age=31536000, immutable" : "no-cache",
			"x-content-type-options": "nosniff",
		});
		if (!isImmutableAsset) {
			// Content-based validators also detect same-size edits with unchanged mtimes.
			const entityTag = `"${new Bun.CryptoHasher("sha256").update(await file.arrayBuffer()).digest("hex")}"`;
			headers.set("etag", entityTag);
			if (matchesEntityTag(request.headers.get("if-none-match"), entityTag)) {
				return new Response(null, { status: 304, headers });
			}
		}
		headers.set("content-length", String(file.size));
		return new Response(request.method === "HEAD" ? null : file, { headers });
	};
}
