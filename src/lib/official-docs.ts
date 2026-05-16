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

export const officialDocLinks = [
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
		label: "React Router modes",
		description: "Decision guide for Declarative, Data, and Framework Mode.",
		href: "https://reactrouter.com/start/modes",
		area: "router",
		keywords: ["react router", "modes", "data mode", "framework mode", "declarative"],
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
		label: "Better Auth SQLite",
		description: "Official SQLite adapter guidance, including Bun built-in SQLite.",
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
		label: "Better Auth rate limit",
		description:
			"Built-in rate limiting, per-route rules, storage options, and client 429 handling.",
		href: "https://better-auth.com/docs/concepts/rate-limit",
		area: "auth",
		keywords: ["better auth", "rate limit", "security", "429"],
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
