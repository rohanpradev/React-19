import type { TechLogoName } from "@/components/tech-logo";

export type OfficialDocArea = "react" | "router" | "bun" | "auth" | "ui" | "platform";

export type OfficialDocLink = {
	label: string;
	description: string;
	href: string;
	area: OfficialDocArea;
	keywords: string[];
	logo?: TechLogoName;
};

export const docsLastCheckedAt = "2026-06-30";
export const docsLastCheckedLabel = "June 30, 2026";

export const docsPosture = [
	{
		title: "React",
		status: "Package updated: 19.2.7",
		detail:
			"react.dev lists React 19.2 as the current documented release line, and this project is on the current 19.2 patch.",
	},
	{
		title: "React Router",
		status: "Package updated: 8.1.0",
		detail:
			"React Router 8 keeps the Data Mode fit for this app because Bun owns the server and bundling while React Router owns route data semantics.",
	},
	{
		title: "Better Auth",
		status: "Package updated: 1.6.23",
		detail:
			"Current docs emphasize session freshness, authoritative reads for sensitive actions, cookie-cache limits, rate-limit storage, and SQLite joins.",
	},
	{
		title: "Bun",
		status: "Runtime checked: 1.3.14",
		detail:
			"Bun docs now center HTML route imports, development HMR/console forwarding, and route maps in Bun.serve.",
	},
] as const;

export const officialDocLinks = [
	{
		label: "React versions",
		description: "Latest documented React release line and archived major-version docs.",
		href: "https://react.dev/versions",
		area: "react",
		keywords: ["react", "versions", "latest", "19.2", "release"],
		logo: "react",
	},
	{
		label: "React 19.2 release",
		description: "Activity, Effect Events, cacheSignal, performance tracks, and SSR updates.",
		href: "https://react.dev/blog/2025/10/01/react-19-2",
		area: "react",
		keywords: ["react", "19.2", "activity", "effect event", "cache signal", "performance"],
		logo: "react",
	},
	{
		label: "React Activity",
		description:
			"Keep hidden UI state warm while effects are unmounted and updates are deprioritized.",
		href: "https://react.dev/reference/react/Activity",
		area: "react",
		keywords: ["react", "activity", "hidden", "visible", "state preservation"],
		logo: "react",
	},
	{
		label: "React useEffectEvent",
		description: "Effect Events, latest values, dependency guardrails, and lint-enforced caveats.",
		href: "https://react.dev/reference/react/useEffectEvent",
		area: "react",
		keywords: ["react", "use effect event", "effect event", "effects", "dependencies"],
		logo: "react",
	},
	{
		label: "useActionState",
		description: "Action state, pending flags, queuing semantics, and form action usage.",
		href: "https://react.dev/reference/react/useActionState",
		area: "react",
		keywords: ["react", "use action state", "actions", "form", "pending"],
		logo: "react",
	},
	{
		label: "React Compiler",
		description:
			"Compiler adoption, purity expectations, memoization strategy, and troubleshooting.",
		href: "https://react.dev/learn/react-compiler",
		area: "react",
		keywords: ["react", "compiler", "memoization", "purity"],
		logo: "react",
	},
	{
		label: "React Performance Tracks",
		description: "Scheduler and component tracks for Chrome performance profiling.",
		href: "https://react.dev/reference/dev-tools/react-performance-tracks",
		area: "react",
		keywords: ["react", "performance", "scheduler", "profiler", "devtools"],
		logo: "react",
	},
	{
		label: "React static prerender",
		description: "Static prerender APIs for prelude output and resumable rendering.",
		href: "https://react.dev/reference/react-dom/static/prerender",
		area: "react",
		keywords: ["react", "static", "prerender", "resume", "ssg"],
		logo: "react",
	},
	{
		label: "React Router modes",
		description: "Decision guide for Declarative, Data, and Framework Mode.",
		href: "https://reactrouter.com/start/modes",
		area: "router",
		keywords: ["react router", "modes", "data mode", "framework mode", "declarative"],
		logo: "react-router",
	},
	{
		label: "React Router v8 upgrade",
		description: "Latest upgrade path from v7, package imports, and v8 compatibility posture.",
		href: "https://reactrouter.com/upgrading/v7",
		area: "router",
		keywords: ["react router", "v8", "upgrade", "latest", "react-router-dom"],
		logo: "react-router",
	},
	{
		label: "React Router data routing",
		description: "Route objects, nested layouts, loaders, actions, and route boundaries.",
		href: "https://reactrouter.com/start/data/routing",
		area: "router",
		keywords: ["react router", "routing", "route objects", "loader", "actions", "layouts"],
		logo: "react-router",
	},
	{
		label: "React Router createBrowserRouter",
		description: "Data router options, hydration data, and route HydrateFallback behavior.",
		href: "https://reactrouter.com/api/data-routers/createBrowserRouter",
		area: "router",
		keywords: ["react router", "create browser router", "hydrate fallback", "data router"],
		logo: "react-router",
	},
	{
		label: "React Router actions",
		description: "Route actions, form submissions, fetchers, and automatic revalidation.",
		href: "https://reactrouter.com/start/data/actions",
		area: "router",
		keywords: ["react router", "actions", "form", "fetcher", "revalidation"],
		logo: "react-router",
	},
	{
		label: "Router concurrency",
		description: "Network concurrency, stale data protection, and browser-aligned cancellation.",
		href: "https://reactrouter.com/explanation/concurrency",
		area: "router",
		keywords: ["react router", "concurrency", "race conditions", "revalidation", "fetchers"],
		logo: "react-router",
	},
	{
		label: "Router data loading",
		description: "Loader data, pending UI, and route-level data ownership.",
		href: "https://reactrouter.com/start/data/data-loading",
		area: "router",
		keywords: ["react router", "loader", "data loading", "pending ui", "route data"],
		logo: "react-router",
	},
	{
		label: "Bun full-stack",
		description:
			"HTML imports, API routes, development mode, and ahead-of-time production bundling.",
		href: "https://bun.sh/docs/bundler/fullstack",
		area: "bun",
		keywords: ["bun", "fullstack", "html imports", "routes", "build"],
		logo: "bun",
	},
	{
		label: "Bun HTTP server",
		description: "Bun.serve routes, dynamic params, lifecycle, and production request handling.",
		href: "https://bun.sh/docs/runtime/http/server",
		area: "bun",
		keywords: ["bun", "serve", "http", "routes", "api"],
		logo: "bun",
	},
	{
		label: "Bun HTML and static sites",
		description: "HTML entrypoints, frontend bundling, static assets, and standalone output.",
		href: "https://bun.sh/docs/bundler/html-static",
		area: "bun",
		keywords: ["bun", "html", "static", "bundler", "assets"],
		logo: "bun",
	},
	{
		label: "Better Auth SQLite",
		description: "Official SQLite adapter guidance, including Bun built-in SQLite and joins.",
		href: "https://better-auth.com/docs/adapters/sqlite#bun-built-in-sqlite",
		area: "auth",
		keywords: ["better auth", "sqlite", "bun", "database", "auth"],
		logo: "better-auth",
	},
	{
		label: "Better Auth sessions",
		description: "Session expiration, freshness, server session reads, and cookie caching.",
		href: "https://better-auth.com/docs/concepts/session-management",
		area: "auth",
		keywords: ["better auth", "session", "fresh age", "cookie cache"],
		logo: "better-auth",
	},
	{
		label: "Better Auth client",
		description: "Client methods and React hooks for session-aware account UI.",
		href: "https://better-auth.com/docs/concepts/client",
		area: "auth",
		keywords: ["better auth", "client", "react", "use session", "hooks"],
		logo: "better-auth",
	},
	{
		label: "Better Auth user accounts",
		description: "Profile updates, email changes, password changes, and account operations.",
		href: "https://better-auth.com/docs/concepts/users-accounts",
		area: "auth",
		keywords: ["better auth", "user", "account", "update user", "change password"],
		logo: "better-auth",
	},
	{
		label: "Better Auth options",
		description: "Reference for baseURL, secrets, session, rate limit, and trusted origins.",
		href: "https://better-auth.com/docs/reference/options",
		area: "auth",
		keywords: ["better auth", "options", "base url", "secret", "trusted origins"],
		logo: "better-auth",
	},
	{
		label: "Better Auth rate limit",
		description:
			"Built-in rate limiting, per-route rules, storage options, and client 429 handling.",
		href: "https://better-auth.com/docs/concepts/rate-limit",
		area: "auth",
		keywords: ["better auth", "rate limit", "security", "429"],
		logo: "better-auth",
	},
	{
		label: "Better Auth security",
		description: "Security reference for cookies, trusted origins, proxies, and request safety.",
		href: "https://better-auth.com/docs/reference/security",
		area: "auth",
		keywords: ["better auth", "security", "cookies", "origins", "proxy"],
		logo: "better-auth",
	},
	{
		label: "shadcn theming",
		description: "CSS variable theme tokens for light, dark, and custom color systems.",
		href: "https://ui.shadcn.com/docs/theming",
		area: "ui",
		keywords: ["shadcn", "theme", "css variables", "tailwind"],
		logo: "shadcn",
	},
	{
		label: "Module Federation",
		description: "Runtime sharing and microfrontend platform concepts.",
		href: "https://module-federation.io/guide/start/",
		area: "platform",
		keywords: ["microfrontend", "module federation", "remote", "host"],
		logo: "module-federation",
	},
] as const satisfies OfficialDocLink[];

export function getOfficialDocsByArea(area: OfficialDocArea) {
	return officialDocLinks.filter((doc) => doc.area === area);
}
