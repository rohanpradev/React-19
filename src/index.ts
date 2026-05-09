import { serve } from "bun";
import path from "node:path";
import { auth } from "@/auth/server";
import { initializeDatabase } from "./db/init";
import index from "./index.html";
import { authProvidersResponse, requireRequestSession, unauthorizedResponse } from "./server/auth";
import { autocompleteCustomers, listCustomers } from "./server/customers";

initializeDatabase();
const isDevelopment = process.env.NODE_ENV !== "production";
const projectRoot = process.cwd();
const productionDistDir = path.resolve(projectRoot, "dist");
const productionIndexPath = path.join(productionDistDir, "index.html");
const siteRoutes = [
	"/",
	"/overview",
	"/architecture",
	"/form-actions",
	"/actions",
	"/optimistic",
	"/react-use",
	"/dom-interop",
	"/search-debounce",
	"/revenue-ops",
	"/auth",
] as const;

function createTextResponse(body: string, contentType: string) {
	return new Response(body, {
		headers: {
			"cache-control": "public, max-age=3600",
			"content-type": contentType,
		},
	});
}

function createRobotsTxt(request: Request) {
	const origin = new URL(request.url).origin;

	return createTextResponse(
		[`User-agent: *`, `Allow: /`, `Sitemap: ${origin}/sitemap.xml`, ""].join("\n"),
		"text/plain; charset=utf-8",
	);
}

function createLlmsTxt(request: Request) {
	const origin = new URL(request.url).origin;

	return createTextResponse(
		[
			"# React Systems Studio",
			"",
			"React Systems Studio is a Bun-powered workspace for modern React architecture, React Router data patterns, accessible UI systems, and SQLite-backed application flows.",
			"",
			"## Primary Pages",
			"",
			`- [Overview](${origin}/overview): Map of the React, Router, Bun, and UI topics in this workspace.`,
			`- [Architecture Playbook](${origin}/architecture): Senior frontend architecture and platform standards.`,
			`- [Revenue Ops](${origin}/revenue-ops): Server-side table state backed by Bun, Drizzle, and SQLite.`,
			`- [Auth](${origin}/auth): Better Auth sign-in and account creation flow.`,
			"",
		].join("\n"),
		"text/markdown; charset=utf-8",
	);
}

function createSitemapXml(request: Request) {
	const origin = new URL(request.url).origin;
	const now = new Date().toISOString();
	const urls = siteRoutes
		.map(
			(route) => `  <url>
    <loc>${origin}${route}</loc>
    <lastmod>${now}</lastmod>
  </url>`,
		)
		.join("\n");

	return createTextResponse(
		`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`,
		"application/xml; charset=utf-8",
	);
}

function getAssetContentType(filePath: string) {
	switch (path.extname(filePath)) {
		case ".css":
			return "text/css; charset=utf-8";
		case ".html":
			return "text/html; charset=utf-8";
		case ".js":
			return "text/javascript; charset=utf-8";
		case ".json":
			return "application/json; charset=utf-8";
		case ".svg":
			return "image/svg+xml; charset=utf-8";
		case ".txt":
			return "text/plain; charset=utf-8";
		case ".xml":
			return "application/xml; charset=utf-8";
		default:
			return "application/octet-stream";
	}
}

function isCompressibleAsset(filePath: string) {
	return [".css", ".html", ".js", ".json", ".svg", ".txt", ".xml"].includes(path.extname(filePath));
}

function getProductionAssetPath(request: Request) {
	const pathname = decodeURIComponent(new URL(request.url).pathname);
	const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
	const resolvedPath = path.resolve(productionDistDir, relativePath);

	if (
		!resolvedPath.startsWith(`${productionDistDir}${path.sep}`) &&
		resolvedPath !== productionIndexPath
	) {
		return null;
	}

	return resolvedPath;
}

async function createProductionFileResponse(
	request: Request,
	filePath: string,
	cacheControl: string,
) {
	const file = Bun.file(filePath);

	if (!(await file.exists())) {
		return null;
	}

	const headers = new Headers({
		"cache-control": cacheControl,
		"content-type": getAssetContentType(filePath),
	});

	if (isCompressibleAsset(filePath) && request.headers.get("accept-encoding")?.includes("gzip")) {
		headers.set("content-encoding", "gzip");
		headers.set("vary", "Accept-Encoding");
		return new Response(Bun.gzipSync(new Uint8Array(await file.arrayBuffer())), { headers });
	}

	return new Response(file, { headers });
}

async function createProductionIndexResponse(request: Request) {
	const file = Bun.file(productionIndexPath);

	if (!(await file.exists())) {
		return null;
	}

	const htmlWithPreloadedCss = (await file.text()).replace(
		/<link rel="stylesheet" crossorigin href="([^"]+\.css)">/,
		`<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`,
	);
	const moduleScriptMatch = htmlWithPreloadedCss.match(
		/\s*<script type="module" crossorigin src="([^"]+\.js)"><\/script>/,
	);
	const moduleScript = moduleScriptMatch?.[0];
	const moduleScriptSrc = moduleScriptMatch?.[1];
	const deferredModuleScript = moduleScriptSrc
		? `<script>
(() => {
  const loadApp = () => {
    const script = document.createElement("script");
    script.type = "module";
    script.crossOrigin = "anonymous";
    script.src = ${JSON.stringify(moduleScriptSrc)};
    document.body.appendChild(script);
  };
  requestAnimationFrame(() => setTimeout(loadApp, 0));
})();
</script>`
		: "";
	const html =
		moduleScript && deferredModuleScript
			? htmlWithPreloadedCss
					.replace(moduleScript, "")
					.replace("</body>", `${deferredModuleScript}\n  </body>`)
			: htmlWithPreloadedCss;
	const headers = new Headers({
		"cache-control": "no-cache",
		"content-type": "text/html; charset=utf-8",
	});

	if (request.headers.get("accept-encoding")?.includes("gzip")) {
		headers.set("content-encoding", "gzip");
		headers.set("vary", "Accept-Encoding");
		return new Response(Bun.gzipSync(new TextEncoder().encode(html)), { headers });
	}

	return new Response(html, { headers });
}

async function createProductionAppResponse(request: Request) {
	const assetPath = getProductionAssetPath(request);

	if (assetPath && path.basename(assetPath) !== "index.html") {
		const assetResponse = await createProductionFileResponse(
			request,
			assetPath,
			"public, max-age=31536000, immutable",
		);

		if (assetResponse) {
			return assetResponse;
		}
	}

	const indexResponse = await createProductionIndexResponse(request);

	if (indexResponse) {
		return indexResponse;
	}

	return new Response("Production build not found. Run `bun run build` first.", {
		status: 503,
		headers: {
			"content-type": "text/plain; charset=utf-8",
		},
	});
}

const appFallback = isDevelopment
	? index
	: {
			GET(req: Request) {
				return createProductionAppResponse(req);
			},
		};

const server = serve({
	routes: {
		"/robots.txt": {
			GET(req) {
				return createRobotsTxt(req);
			},
		},
		"/llms.txt": {
			GET(req) {
				return createLlmsTxt(req);
			},
		},
		"/sitemap.xml": {
			GET(req) {
				return createSitemapXml(req);
			},
		},

		"/api/auth": auth.handler,
		"/api/auth/*": auth.handler,
		"/api/auth-providers": {
			GET() {
				return authProvidersResponse();
			},
		},

		"/api/hello": {
			async GET(_req) {
				return Response.json({
					message: "Hello, world!",
					method: "GET",
				});
			},
			async PUT(_req) {
				return Response.json({
					message: "Hello, world!",
					method: "PUT",
				});
			},
		},

		"/api/hello/:name": async (req) => {
			const name = req.params.name;
			return Response.json({
				message: `Hello, ${name}!`,
			});
		},

		"/api/customers": {
			async GET(req) {
				const session = await requireRequestSession(req);

				if (!session) {
					return unauthorizedResponse();
				}

				return Response.json(listCustomers(req));
			},
		},

		"/api/customers/autocomplete": {
			async GET(req) {
				const session = await requireRequestSession(req);

				if (!session) {
					return unauthorizedResponse();
				}

				return Response.json(autocompleteCustomers(req));
			},
		},

		// Serve the app shell for all unmatched routes.
		"/*": appFallback,
	},

	development: isDevelopment
		? {
				// Enable browser hot reloading in development
				hmr: true,

				// Echo console logs from the browser to the server
				console: true,
			}
		: false,
});

console.log(`Server running at ${server.url}`);
