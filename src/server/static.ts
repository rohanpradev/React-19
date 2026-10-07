import path from "node:path";

/** Only the browser build belongs in this directory; server output is its sibling. */
export function createProductionAppHandler(publicDirectory: string) {
	const publicRoot = path.resolve(publicDirectory);
	return async (request: Request) => {
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: { allow: "GET, HEAD" },
			});
		}

		let pathname: string;
		try {
			pathname = decodeURIComponent(new URL(request.url).pathname);
		} catch {
			return new Response("Bad Request", { status: 400 });
		}
		// Reject platform-specific separators, dotfiles, and traversal before resolving.
		if (/[\\\0:]/.test(pathname) || pathname.split("/").some((part) => part.startsWith("."))) {
			return new Response("Not Found", { status: 404 });
		}
		if (pathname === "/api" || pathname.startsWith("/api/")) {
			return Response.json({ error: "Not found." }, { status: 404 });
		}

		const resolvedPath = path.resolve(publicRoot, pathname.replace(/^\/+/, "") || "index.html");
		const relative = path.relative(publicRoot, resolvedPath);
		if (relative.startsWith("..") || path.isAbsolute(relative)) {
			return new Response("Not Found", { status: 404 });
		}
		let file = Bun.file(resolvedPath);
		let isDocument = path.extname(resolvedPath) === ".html";
		if (!(await file.exists())) {
			// Missing assets must not be cached as successful HTML responses.
			if (path.extname(pathname)) return new Response("Not Found", { status: 404 });
			file = Bun.file(path.join(publicRoot, "index.html"));
			isDocument = true;
			if (!(await file.exists())) {
				return new Response("Production build not found.", { status: 503 });
			}
		}
		return new Response(request.method === "HEAD" ? null : file, {
			headers: {
				"content-type": file.type,
				"cache-control": isDocument ? "no-cache" : "public, max-age=31536000, immutable",
				"x-content-type-options": "nosniff",
			},
		});
	};
}
