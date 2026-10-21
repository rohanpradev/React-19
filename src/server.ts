import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { type HTMLBundle, type Server, serve } from "bun";

import { permissions } from "@/auth/permissions";
import { auth } from "@/auth/server";
import { serverEnv } from "@/config/server-env";
import { sqlite } from "@/db";

import { initializeDatabase } from "./db/init";
import { AccessError, createAccessHandlers, createAccessService } from "./server/access";
import {
	authProvidersResponse,
	requireRequestPermission,
	requireRequestSession,
} from "./server/auth";
import { autocompleteCustomers, listCustomers } from "./server/customers";
import { listPlatformSignals, updatePlatformSignal } from "./server/platform-signals";
import { apiRoute, MAX_REQUEST_BODY_BYTES, validateMutationOrigin } from "./server/requests";
import { privateJson, privateResponse } from "./server/responses";
import { createProductionAppHandler } from "./server/static";

const { isDevelopment } = serverEnv;
const projectRoot = process.cwd();
const productionDistDir = path.resolve(projectRoot, "dist/public");
const canonicalOrigin = new URL(serverEnv.auth.baseURL).origin;

const siteRoutes = [
	"/",
	"/overview",
	"/architecture",
	"/platform-readiness",
	"/control-room",
	"/form-actions",
	"/actions",
	"/optimistic",
	"/react-use",
	"/dom-interop",
	"/search-debounce",
	"/virtual-explorer",
	"/workflow-board",
	"/intake-form",
	"/upload-manager",
	"/workbench-layout",
	"/server-state",
	"/revenue-ops",
	"/account",
	"/access",
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
			`- [Virtual Explorer](${origin}/virtual-explorer): High-volume entity browsing with deferred filters and virtualized rendering.`,
			`- [Upload Manager](${origin}/upload-manager): File intake workflow with validation, optimistic queueing, progress, retry, and cancel states.`,
			`- [Workbench Layout](${origin}/workbench-layout): Resizable enterprise shell with accessible splitters and Activity-preserved panels.`,
			`- [Revenue Ops](${origin}/revenue-ops): Server-side table state backed by Bun, Drizzle, and SQLite.`,
			`- [Account](${origin}/account): Better Auth profile, password, and session management.`,
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

function withSocketClientIp(request: Request, server: Server<undefined>) {
	const clientAddress = server.requestIP(request);

	if (!clientAddress) {
		return request;
	}

	const headers = new Headers(request.headers);
	headers.set("x-real-ip", clientAddress.address);

	return new Request(request, { headers });
}

async function handleAuthRequest(request: Request, server: Server<undefined>) {
	return privateResponse(await auth.handler(withSocketClientIp(request, server)));
}

type PackageManifest = {
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
};

async function createPlatformHealthResponse() {
	const packageJson = (await Bun.file(
		path.join(projectRoot, "package.json"),
	).json()) as PackageManifest;

	return privateJson({
		status: "ok",
		runtime: {
			bun: Bun.version,
			mode: isDevelopment ? "development" : "production",
		},
		packages: {
			react: packageJson.dependencies?.["react"] ?? "unknown",
			"react-router": packageJson.dependencies?.["react-router"] ?? "unknown",
			"better-auth": packageJson.dependencies?.["better-auth"] ?? "unknown",
			"@tanstack/react-query": packageJson.dependencies?.["@tanstack/react-query"] ?? "unknown",
			"@tanstack/react-form": packageJson.dependencies?.["@tanstack/react-form"] ?? "unknown",
			"@dnd-kit/core": packageJson.dependencies?.["@dnd-kit/core"] ?? "unknown",
			"drizzle-orm": packageJson.dependencies?.["drizzle-orm"] ?? "unknown",
			valibot: packageJson.dependencies?.["valibot"] ?? "unknown",
			tailwindcss: packageJson.devDependencies?.["tailwindcss"] ?? "unknown",
			typescript: packageJson.devDependencies?.["typescript"] ?? "unknown",
		},
		checks: [
			"React Router Data Mode route tree is defined outside render.",
			"Better Auth owns server-side session checks and supports rotation-safe versioned secrets.",
			"Bun supplies a socket-derived client IP to Better Auth rate limiting by default.",
			"Bun serves API routes and the React app from one runtime.",
			"TanStack Query caches are isolated for each authenticated session.",
			"Biome Drizzle rules guard destructive updates and deletes without where clauses.",
			"Drizzle v1 migration integrity is checked independently from runtime migration execution.",
			"Production serves only the separate dist/public browser build.",
		],
	});
}

function createReadinessResponse() {
	try {
		sqlite.query("SELECT 1").get();
		return privateJson({ status: "ok" });
	} catch {
		return privateJson({ status: "unavailable" }, { status: 503 });
	}
}

function readProductionAssetManifest() {
	const manifestPath = path.join(projectRoot, "dist", "asset-manifest.json");
	// Serving without a manifest remains safe: all assets will revalidate.
	if (isDevelopment || !existsSync(manifestPath)) return new Set<string>();
	const entries: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
	if (
		!Array.isArray(entries) ||
		!entries.every((entry): entry is string => typeof entry === "string" && entry.startsWith("/"))
	) {
		throw new Error("Production asset manifest must contain root-relative asset paths.");
	}
	return new Set<string>(entries);
}

export function startServer(frontend?: HTMLBundle) {
	const createProductionAppResponse = createProductionAppHandler(
		productionDistDir,
		readProductionAssetManifest(),
	);
	initializeDatabase();
	const accessService = createAccessService(sqlite);
	const accessHandlers = createAccessHandlers({
		service: accessService,
		canonicalOrigin,
		resolveActor: async (request) => {
			const session = await requireRequestSession(request);
			return session ? { userId: session.user.id, sessionId: session.session.id } : null;
		},
	});
	const server = serve({
		port: serverEnv.port,
		maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
		routes: {
			"/healthz": apiRoute({ GET: createReadinessResponse }),
			// Static & SEO
			"/robots.txt": createRobotsTxt,
			"/llms.txt": createLlmsTxt,
			"/sitemap.xml": createSitemapXml,

			// Authentication (Better Auth)
			"/api/auth": handleAuthRequest,
			"/api/auth/*": handleAuthRequest,
			"/api/auth-providers": apiRoute({ GET: authProvidersResponse }),
			"/api/platform/health": apiRoute({ GET: createPlatformHealthResponse }),
			"/api/platform/signals": apiRoute({
				GET: async (req) => {
					const access = await requireRequestPermission(req, permissions.signalsRead);
					if (!access.ok) return access.response;
					return privateJson(listPlatformSignals());
				},
				PATCH: async (req) => {
					const originError = validateMutationOrigin(req, canonicalOrigin);
					if (originError) return originError;
					const access = await requireRequestPermission(req, permissions.signalsWrite);
					if (!access.ok) return access.response;
					return privateResponse(
						await updatePlatformSignal(req, () => {
							try {
								accessService.authorize(
									{ userId: access.session.user.id, sessionId: access.session.session.id },
									permissions.signalsWrite,
								);
								return null;
							} catch (error) {
								if (error instanceof AccessError)
									return privateJson(
										{ error: error.message, code: error.code },
										{ status: error.status },
									);
								throw error;
							}
						}),
					);
				},
			}),
			"/api/access": apiRoute({ GET: accessHandlers.list }),
			"/api/access/roles": apiRoute({ PATCH: accessHandlers.updateRole }),

			// API Routes
			"/api/hello": apiRoute({
				GET: () => Response.json({ message: "Hello from Bun!", timestamp: Date.now() }),
				PUT: () => Response.json({ message: "Update successful" }),
			}),
			"/api/hello/:name": (req) => {
				return apiRoute({
					GET: () => Response.json({ message: `Hello, ${req.params.name}!` }),
				})(req);
			},

			// Protected API Routes
			"/api/customers": apiRoute({
				GET: async (req) => {
					const access = await requireRequestPermission(req, permissions.customersRead);
					if (!access.ok) return access.response;
					return privateJson(listCustomers(req));
				},
			}),
			"/api/customers/autocomplete": apiRoute({
				GET: async (req) => {
					const access = await requireRequestPermission(req, permissions.customersRead);
					if (!access.ok) return access.response;
					return privateJson(autocompleteCustomers(req));
				},
			}),

			// App Shell Fallback
			"/api/*": () => privateJson({ error: "Not found." }, { status: 404 }),
			"/*": frontend ?? createProductionAppResponse,
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
			return privateResponse(new Response("Internal Server Error", { status: 500 }));
		},
	});

	console.log(`Server ready at ${server.url}`);

	return server;
}
