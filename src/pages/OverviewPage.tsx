import { NavLink } from "react-router";

import {
	ArrowRight,
	ArrowUpRight,
	BookOpenText,
	ChevronDown,
	Layers3,
	type LucideIcon,
	Route,
	Server,
	ShieldCheck,
	Sparkles,
} from "lucide-react";

import { RouteExplorer } from "@/components/route-explorer";
import { TechLogo, type TechLogoName } from "@/components/tech-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { navItems } from "@/lib/navigation";
import { docsLastCheckedLabel, officialDocLinks } from "@/lib/official-docs";
import { stackVersions } from "@/lib/stack-versions";

const learningRoutes = navItems.filter((item) => item.path !== "/overview");

const studioStats = [
	{ value: stackVersions.react, label: "React APIs", detail: "Actions, use, DOM APIs" },
	{ value: String(learningRoutes.length), label: "Learning routes", detail: "Lazy route modules" },
	{ value: "Bun", label: "Full-stack runtime", detail: "APIs, build, SQLite" },
	{ value: "TS7", label: "Bun type checker", detail: "Built-in type checks" },
] as const;

const systemCards = [
	{
		title: "React architecture",
		description: "Transition-aware mutations, Suspense reads, optimistic paths, and DOM interop.",
		icon: Sparkles,
		logo: "react",
		href: "/architecture",
	},
	{
		title: "Routing shell",
		description: "Data-router route objects, lazy boundaries, redirects, and error surfaces.",
		icon: Route,
		logo: "react-router",
		href: "/platform-readiness",
	},
	{
		title: "Bun data layer",
		description: "One runtime for frontend delivery, API routes, Better Auth, Drizzle, and SQLite.",
		icon: Server,
		logo: "bun",
		href: "/revenue-ops",
	},
	{
		title: "Platform readiness",
		description: "Source-backed upgrade posture for React, Router, Better Auth, and Bun.",
		icon: ShieldCheck,
		logo: "better-auth",
		href: "/platform-readiness",
	},
] as const satisfies {
	title: string;
	description: string;
	icon: LucideIcon;
	logo: "react" | "react-router" | "bun" | "better-auth";
	href: string;
}[];

const docsLinks = officialDocLinks.filter((doc) =>
	[
		"React versions",
		"React 19.3 release",
		"React Router modes",
		"Bun full-stack",
		"Better Auth sessions",
		"React useSyncExternalStore",
		"TanStack Query",
		"TanStack Form validation",
		"dnd-kit",
		"Biome Drizzle domain",
		"React libraries 2026",
	].includes(doc.label),
);

export function OverviewPage() {
	return (
		<div className="space-y-7">
			<section className="app-hero">
				<div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
					<div className="p-6 sm:p-8 lg:p-9">
						<div className="mb-6 flex flex-wrap items-center gap-2">
							<Badge variant="outline" className="gap-1.5 bg-background">
								<span className="size-1.5 rounded-full bg-primary" />
								React Systems Studio
							</Badge>
							<span className="text-xs text-muted-foreground">Explore. Build. Understand.</span>
						</div>
						<h1 className="max-w-2xl font-display text-3xl font-semibold tracking-tight leading-[1.12] sm:text-4xl xl:text-5xl">
							Build with confidence.
							<br />
							<span className="text-primary">Understand the system.</span>
						</h1>
						<p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
							Working examples, thoughtful architecture, and the patterns behind production apps.
							Pick a track and make it your own.
						</p>
						<div className="mt-6 flex flex-wrap items-center gap-3">
							<Button asChild>
								<NavLink to="/architecture">
									Explore architecture
									<ArrowRight className="size-4" />
								</NavLink>
							</Button>
							<Button asChild variant="ghost">
								<a href="#learning-tracks">
									Browse examples
									<ChevronDown className="size-4" />
								</a>
							</Button>
						</div>
					</div>
					<div className="border-t border-border bg-muted/25 p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-6">
						<div className="flex items-center gap-2 text-xs font-semibold">
							<Layers3 className="size-4 text-primary" />
							Inside the studio
						</div>
						<div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-1">
							{[
								["react", "Interface", `React ${stackVersions.react}`],
								["react-router", "Navigation", "React Router"],
								["bun", "Runtime", "Bun + SQLite"],
								["shadcn", "Components", "shadcn/ui + Radix"],
							].map(([logo, label, detail]) => (
								<div key={label} className="flex items-center gap-3">
									<span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
										<TechLogo name={logo as TechLogoName} className="size-4" />
									</span>
									<div>
										<p className="text-[11px] text-muted-foreground">{label}</p>
										<p className="text-sm font-medium">{detail}</p>
									</div>
								</div>
							))}
						</div>
						<p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
							Real examples. One connected stack.
						</p>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-px border-t border-border bg-border lg:grid-cols-4">
					{studioStats.map((stat) => (
						<div key={stat.label} className="bg-card px-5 py-4 sm:px-7">
							<p className="text-xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
							<p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
						</div>
					))}
				</div>
			</section>

			<div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
				<section id="learning-tracks" className="min-w-0 scroll-mt-28">
					<div className="mb-5 flex items-center justify-between gap-3">
						<div>
							<h2 className="text-xl font-semibold tracking-tight">Explore the patterns</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Find the right example for what you’re building.
							</p>
						</div>
						<Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
							{learningRoutes.length} examples
						</Badge>
					</div>
					<RouteExplorer />
				</section>
				<section className="space-y-4">
					<div className="pt-0.5">
						<h2 className="text-xl font-semibold tracking-tight">Under the hood</h2>
						<p className="mt-1 text-sm text-muted-foreground">How the pieces fit together.</p>
					</div>
					<div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
						{systemCards.map((item) => {
							const Icon = item.icon;
							return (
								<Card
									key={item.title}
									className="group relative gap-3 py-5 transition-colors hover:border-primary/40 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50"
								>
									<CardHeader className="px-5">
										<div className="mb-2 flex items-center justify-between">
											<Icon aria-hidden="true" className="size-5 text-primary" />
											<ArrowUpRight
												aria-hidden="true"
												className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
											/>
										</div>
										<CardTitle>
											<h3>
												<NavLink
													to={item.href}
													className="after:absolute after:inset-0 after:rounded-xl"
												>
													{item.title}
												</NavLink>
											</h3>
										</CardTitle>
										<CardDescription className="leading-6">{item.description}</CardDescription>
									</CardHeader>
								</Card>
							);
						})}
					</div>
				</section>
			</div>

			<section className="border-t border-border pt-6">
				<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
					<h2 className="text-lg font-semibold tracking-tight">Reference shelf</h2>
					<p className="text-xs text-muted-foreground">
						Official docs · reviewed {docsLastCheckedLabel}
					</p>
				</div>
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
					{docsLinks.map((doc) => (
						<a
							key={doc.href}
							href={doc.href}
							target="_blank"
							rel="noreferrer"
							className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-card"
						>
							{doc.logo ? (
								<TechLogo name={doc.logo} className="size-4 shrink-0" />
							) : (
								<BookOpenText className="size-4 shrink-0" />
							)}
							<span className="min-w-0 flex-1 truncate text-xs font-medium">{doc.label}</span>
							<span className="sr-only"> (opens in a new tab)</span>
							<ArrowUpRight aria-hidden="true" className="size-3.5 text-muted-foreground" />
						</a>
					))}
				</div>
			</section>
		</div>
	);
}
