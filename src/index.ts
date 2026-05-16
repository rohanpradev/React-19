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
	"/platform-readiness",
	"/form-actions",
	"/actions",
	"/optimistic",
	"/react-use",
	"/dom-interop",
	"/search-debounce",
	"/revenue-ops",
	"/auth",
] as const;

// SEO and Meta Handlers
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
			`- [Platform Readiness](${origin}/platform-readiness): Source-backed upgrade posture for React, React Router, Better Auth, and Bun.`,
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

type PackageManifest = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

async function createPlatformHealthResponse() {
	const packageJson = (await Bun.file(
		path.join(projectRoot, "package.json"),
	).json()) as PackageManifest;

	return Response.json({
		status: "ok",
		runtime: {
			bun: Bun.version,
			mode: isDevelopment ? "development" : "production",
		},
		packages: {
			react: packageJson.dependencies?.react ?? "unknown",
			"react-router": packageJson.dependencies?.["react-router"] ?? "unknown",
			"better-auth": packageJson.dependencies?.["better-auth"] ?? "unknown",
			tailwindcss: packageJson.devDependencies?.tailwindcss ?? "unknown",
			"@typescript/native-preview":
				packageJson.devDependencies?.["@typescript/native-preview"] ?? "unknown",
		},
		checks: [
			"React Router Data Mode route tree is defined outside render.",
			"Better Auth owns server-side session checks for protected API routes.",
			"Bun serves API routes and the React app from one runtime.",
			"Production assets are resolved inside the dist directory before serving.",
		],
	});
}

function getAssetContentType(filePath: string) {
	const ext = path.extname(filePath);
	const types: Record<string, string> = {
		".css": "text/css; charset=utf-8",
		".html": "text/html; charset=utf-8",
		".js": "text/javascript; charset=utf-8",
		".json": "application/json; charset=utf-8",
		".svg": "image/svg+xml; charset=utf-8",
		".txt": "text/plain; charset=utf-8",
		".xml": "application/xml; charset=utf-8",
	};
	return types[ext] ?? "application/octet-stream";
}

function isPathInside(parentPath: string, childPath: string) {
	const relativePath = path.relative(parentPath, childPath);
	return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

async function createProductionAppResponse(request: Request) {
	let pathname: string;

	try {
		pathname = decodeURIComponent(new URL(request.url).pathname);
	} catch {
		return new Response("Bad Request", { status: 400 });
	}

	const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
	const resolvedPath = path.resolve(productionDistDir, relativePath);

	if (!isPathInside(productionDistDir, resolvedPath)) {
		return new Response("Not Found", { status: 404 });
	}

	const file = Bun.file(resolvedPath);
	const exists = await file.exists();

	if (!exists) {
		const indexFile = Bun.file(productionIndexPath);
		if (!(await indexFile.exists())) {
			return new Response("Production build not found.", { status: 503 });
		}
		return new Response(indexFile, {
			headers: {
				"cache-control": "no-cache",
				"content-type": "text/html; charset=utf-8",
			},
		});
	}

	const isDocument = resolvedPath === productionIndexPath || path.extname(resolvedPath) === ".html";

	return new Response(file, {
		headers: {
			"cache-control": isDocument ? "no-cache" : "public, max-age=31536000, immutable",
			"content-type": getAssetContentType(resolvedPath),
		},
	});
}

const server = serve({
	routes: {
		// Static & SEO
		"/robots.txt": createRobotsTxt,
		"/llms.txt": createLlmsTxt,
		"/sitemap.xml": createSitemapXml,

		// Authentication (Better Auth)
		"/api/auth": auth.handler,
		"/api/auth/*": auth.handler,
		"/api/auth-providers": authProvidersResponse,
		"/api/platform/health": createPlatformHealthResponse,

		// API Routes
		"/api/hello": {
			GET: () => Response.json({ message: "Hello from Bun!", timestamp: Date.now() }),
			PUT: () => Response.json({ message: "Update successful" }),
		},
		"/api/hello/:name": (req) => {
			return Response.json({ message: `Hello, ${req.params.name}!` });
		},

		// Protected API Routes
		"/api/customers": async (req) => {
			const session = await requireRequestSession(req);
			if (!session) return unauthorizedResponse();
			return Response.json(listCustomers(req));
		},
		"/api/customers/autocomplete": async (req) => {
			const session = await requireRequestSession(req);
			if (!session) return unauthorizedResponse();
			return Response.json(autocompleteCustomers(req));
		},

		// App Shell Fallback
		"/*": isDevelopment ? index : createProductionAppResponse,
	},

	development: isDevelopment
		? {
				hmr: true,
				console: true,
			}
		: false,

	// Global error handling and logging
	error(error) {
		console.error("Server Error:", error);
		return new Response("Internal Server Error", { status: 500 });
	},
});

console.log(`Server ready at ${server.url}`);
