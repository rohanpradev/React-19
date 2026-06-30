import { NavLink } from "react-router";

import {
	ArrowRight,
	ArrowUpRight,
	BookOpenText,
	CheckCircle2,
	Layers3,
	type LucideIcon,
	Route,
	Server,
	ShieldCheck,
	Sparkles,
	Workflow,
} from "lucide-react";

import { TechLogo, type TechLogoName, TechPill } from "@/components/tech-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { learningStages, navItems } from "@/lib/navigation";
import { officialDocLinks } from "@/lib/official-docs";

const learningRoutes = navItems.filter((item) => item.path !== "/overview");

const learningTracks = (Object.keys(learningStages) as Array<keyof typeof learningStages>)
	.map((stage) => ({
		stage,
		label: learningStages[stage],
		items: learningRoutes.filter((item) => item.stage === stage),
	}))
	.filter((track) => track.items.length > 0);

const studioStats = [
	{ value: "19.2", label: "React APIs", detail: "Actions, use, DOM APIs" },
	{ value: "7", label: "Router Data Mode", detail: "Lazy route modules" },
	{ value: "Bun", label: "Full-stack runtime", detail: "APIs, build, SQLite" },
	{ value: "TS7", label: "Native preview", detail: "tsgo type checks" },
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
		"React 19.2 release",
		"React Router modes",
		"Bun full-stack",
		"Better Auth sessions",
	].includes(doc.label),
);

export function OverviewPage() {
	return (
		<div className="space-y-6">
			<section className="app-hero p-5 sm:p-8 lg:p-10">
				<div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
					<div className="max-w-4xl space-y-6">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Frontend architecture lab</Badge>
							<Badge variant="outline">Bun + React 19.2</Badge>
						</div>

						<div className="space-y-4">
							<h1 className="font-display text-4xl leading-none text-foreground sm:text-5xl lg:text-6xl">
								Modern React, without the clutter.
							</h1>
							<p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
								A focused workspace for React 19.2 features, router architecture, UI systems, and
								Bun-backed data flows.
							</p>
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
							<Button asChild size="lg">
								<NavLink to="/architecture">
									Start with architecture
									<ArrowRight className="size-4" />
								</NavLink>
							</Button>
							<Button asChild variant="outline" size="lg" className="bg-card/70">
								<NavLink to="/form-actions">
									Open React demos
									<ArrowRight className="size-4" />
								</NavLink>
							</Button>
						</div>

						<div className="flex flex-wrap gap-2">
							<TechPill name="react" />
							<TechPill name="react-router" />
							<TechPill name="bun" />
							<TechPill name="better-auth" />
							<TechPill name="tanstack" />
							<TechPill name="drizzle" />
							<TechPill name="sqlite" />
							<TechPill name="typescript" />
						</div>
					</div>

					<div className="app-surface p-4 sm:p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
									Live stack
								</p>
								<p className="mt-1 font-display text-2xl leading-none">Product-grade patterns</p>
							</div>
							<div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
								<Layers3 className="size-5" />
							</div>
						</div>

						<div className="mt-5 grid grid-cols-2 gap-2">
							{[
								["react", "React UI"],
								["react-router", "Router"],
								["bun", "Runtime"],
								["better-auth", "Auth"],
								["drizzle", "ORM"],
								["sqlite", "Database"],
							].map(([logo, label]) => (
								<div key={label} className="rounded-lg border border-border/55 bg-muted/35 p-3">
									<TechLogo name={logo as TechLogoName} className="size-5" />
									<p className="mt-3 text-sm font-medium">{label}</p>
								</div>
							))}
						</div>

						<div className="mt-4 rounded-lg border border-success/25 bg-success/10 p-4 text-foreground">
							<div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-success uppercase">
								<CheckCircle2 className="size-4" />
								Validated workflow
							</div>
							<p className="mt-3 text-sm leading-6 text-muted-foreground">
								Biome, tsgo, and Bun build run together through{" "}
								<code className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5 text-foreground">
									bun run validate
								</code>
								.
							</p>
						</div>
					</div>
				</div>
			</section>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				{studioStats.map((stat) => (
					<div key={stat.label} className="app-surface p-4">
						<p className="font-display text-3xl leading-none text-foreground">{stat.value}</p>
						<p className="mt-3 text-sm font-semibold text-foreground">{stat.label}</p>
						<p className="mt-1 text-xs leading-5 text-muted-foreground">{stat.detail}</p>
					</div>
				))}
			</div>

			<div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle className="font-display text-3xl">Learning tracks</CardTitle>
						<CardDescription>Grouped routes so the workspace feels intentional.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{learningTracks.map((track) => (
							<div key={track.stage} className="app-muted-surface p-4">
								<div className="flex items-center justify-between gap-3">
									<p className="font-semibold text-foreground">{track.label}</p>
									<Badge variant="outline">{track.items.length} routes</Badge>
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{track.items.map((route) => (
										<Button
											key={route.path}
											asChild
											variant="outline"
											size="sm"
											className="bg-card/70"
										>
											<NavLink to={route.path}>{route.label}</NavLink>
										</Button>
									))}
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
					{systemCards.map((item) => {
						const Icon = item.icon;

						return (
							<Card key={item.title} className="group border-border/60">
								<CardHeader className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<Icon className="size-5" />
										</div>
										<TechLogo name={item.logo} className="size-5 opacity-80" />
									</div>
									<div>
										<CardTitle>{item.title}</CardTitle>
										<CardDescription className="mt-2 leading-6">{item.description}</CardDescription>
									</div>
								</CardHeader>
								<CardContent>
									<Button asChild variant="ghost" size="sm" className="px-0">
										<NavLink to={item.href}>
											View system
											<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
										</NavLink>
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>

			<Card className="border-border/60">
				<CardHeader className="md:flex-row md:items-center md:justify-between">
					<div>
						<CardTitle className="font-display text-3xl">Reference shelf</CardTitle>
						<CardDescription>Primary docs kept one click away.</CardDescription>
					</div>
					<div className="hidden size-11 items-center justify-center rounded-lg bg-accent/55 text-accent-foreground md:flex">
						<BookOpenText className="size-5" />
					</div>
				</CardHeader>
				<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
					{docsLinks.map((doc) => (
						<a
							key={doc.href}
							href={doc.href}
							target="_blank"
							rel="noreferrer"
							className="group flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/35 p-3 transition-colors hover:bg-muted/60"
						>
							<span className="flex min-w-0 items-center gap-3">
								{doc.logo ? (
									<TechLogo name={doc.logo} className="size-5" />
								) : (
									<BookOpenText className="size-5" />
								)}
								<span className="truncate text-sm font-medium">{doc.label}</span>
							</span>
							<ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						</a>
					))}
				</CardContent>
			</Card>

			<div className="grid gap-3 md:grid-cols-3">
				<div className="app-muted-surface p-4">
					<Workflow className="size-5 text-primary" />
					<p className="mt-3 text-sm font-semibold">Mutation patterns</p>
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						Actions, transitions, optimistic updates.
					</p>
				</div>
				<div className="app-muted-surface p-4">
					<ShieldCheck className="size-5 text-primary" />
					<p className="mt-3 text-sm font-semibold">Private workspace</p>
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						Better Auth redirects and session gating.
					</p>
				</div>
				<div className="app-muted-surface p-4">
					<BookOpenText className="size-5 text-primary" />
					<p className="mt-3 text-sm font-semibold">Reference-first</p>
					<p className="mt-1 text-xs leading-5 text-muted-foreground">
						Docs are linked without turning pages into articles.
					</p>
				</div>
			</div>
		</div>
	);
}
