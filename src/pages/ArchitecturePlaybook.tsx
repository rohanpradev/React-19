import {
	Activity as ActivityIcon,
	ArrowUpRight,
	BrainCircuit,
	CheckCircle2,
	Gauge,
	GitBranch,
	Network,
	Route,
	ShieldCheck,
	Split,
	Waypoints,
	type LucideIcon,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { TechPill } from "@/components/tech-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const reactCapabilities = [
	{
		name: "<Activity>",
		status: "Stable 19.2",
		tone: "stable",
		call: "Keep hidden UI warm without keeping effects mounted.",
		fit: "Tabs, drawers, route previews, back-stack state.",
		risk: "Budget hidden rendering so it does not steal work from visible UI.",
	},
	{
		name: "useEffectEvent",
		status: "Stable 19.2",
		tone: "stable",
		call: "Separate subscription lifecycle from event payload.",
		fit: "Sockets, observers, analytics, notifications.",
		risk: "Do not use it to silence dependency warnings for normal effects.",
	},
	{
		name: "Actions",
		status: "React 19",
		tone: "stable",
		call: "Treat mutations as UI workflows with pending, error, and optimistic states.",
		fit: "Forms, command buttons, server mutations.",
		risk: "Every optimistic path needs rollback and reconciliation rules.",
	},
	{
		name: "use + Suspense",
		status: "React 19",
		tone: "stable",
		call: "Move async reads behind explicit loading and error boundaries.",
		fit: "Route resources, deferred panels, context reads.",
		risk: "Avoid sprinkling Suspense without skeleton and reveal strategy.",
	},
	{
		name: "cacheSignal",
		status: "RSC only",
		tone: "specialized",
		call: "Abort cached server work when React no longer needs the render.",
		fit: "Server Components, deduped fetches, expensive server IO.",
		risk: "Keep it out of client-only apps and document the framework boundary.",
	},
	{
		name: "React Compiler",
		status: "Adopt incrementally",
		tone: "specialized",
		call: "Optimize by writing pure, compiler-friendly components first.",
		fit: "Design systems, dense tables, expensive interaction surfaces.",
		risk: "Manual memoization becomes a compatibility contract, not a reflex.",
	},
	{
		name: "Partial pre-render",
		status: "React DOM 19.2",
		tone: "specialized",
		call: "Serve static shells from CDN and resume dynamic regions later.",
		fit: "Marketing plus app hybrids, content-heavy authenticated products.",
		risk: "Needs server/runtime ownership, cache policy, and streaming tests.",
	},
	{
		name: "<ViewTransition>",
		status: "Canary watch",
		tone: "watch",
		call: "Plan motion boundaries, but do not depend on it in stable builds.",
		fit: "Route motion, shared elements, Suspense reveal polish.",
		risk: "Respect reduced motion and avoid shipping Canary APIs accidentally.",
	},
] as const;

const architectureLanes = [
	{
		title: "Route Architecture",
		icon: Route,
		own: "Nested layouts, loaders/actions, error boundaries, pending UI.",
		standard: "Routes are product seams; data, SEO, and recovery live at the route edge.",
	},
	{
		title: "Rendering Strategy",
		icon: ActivityIcon,
		own: "Client, SSR, streaming, Suspense, Activity, and pre-render choices.",
		standard: "Choose per route. Never make rendering mode a global ideology.",
	},
	{
		title: "State & Server Data",
		icon: Waypoints,
		own: "URL state, server cache, optimistic mutations, local ephemeral state.",
		standard: "Server data is not global UI state. URL state is a public contract.",
	},
	{
		title: "Design System",
		icon: ShieldCheck,
		own: "Tokens, shadcn primitives, accessibility, motion, density, theming.",
		standard: "Components expose intent and variants, not one-off page styling.",
	},
	{
		title: "Performance Model",
		icon: Gauge,
		own: "Bundle budgets, React Performance tracks, code splitting, input latency.",
		standard: "Measure scheduler pressure and component work before optimizing blindly.",
	},
	{
		title: "Platform Governance",
		icon: BrainCircuit,
		own: "Compiler readiness, package policy, lint rules, ownership, ADRs.",
		standard: "Architecture is enforced through tooling, docs, and review gates.",
	},
] as const satisfies {
	title: string;
	icon: LucideIcon;
	own: string;
	standard: string;
}[];

const microfrontendRules = [
	{
		title: "Default to modular monolith first",
		detail: "Use packages/workspaces until independent deploys are a real business need.",
	},
	{
		title: "Use runtime federation for deploy autonomy",
		detail: "It fits separate release trains, large product areas, and team-owned surfaces.",
	},
	{
		title: "Keep one accountable shell",
		detail: "The host owns auth, routing, layout, telemetry, theme, and failure surfaces.",
	},
	{
		title: "Make remote contracts boring",
		detail: "Typed props, route manifests, version policy, capability flags, and fallbacks.",
	},
] as const;

const platformContracts = [
	"React, React DOM, and router versions are singleton platform dependencies.",
	"Each remote ships an error boundary, loading state, health check, and rollback plan.",
	"Design tokens are shared; page-specific CSS is isolated to the owning surface.",
	"No cross-remote global stores unless the platform team owns the event protocol.",
	"Every route-level split has a budget for JS, data round trips, and interaction latency.",
	"Accessibility, reduced motion, keyboard nav, and focus recovery are release blockers.",
] as const;

const frontendRadar = [
	{
		label: "Adopt now",
		items: ["React 19.2", "Router data boundaries", "Actions", "Activity", "Biome gates"],
	},
	{
		label: "Pilot",
		items: ["React Compiler", "Partial pre-render", "RSC boundary", "Module Federation"],
	},
	{
		label: "Watch",
		items: ["ViewTransition", "RSC in routers", "edge stream caching", "design token tooling"],
	},
] as const;

const docs = [
	{
		label: "React 19.2",
		href: "https://react.dev/blog/2025/10/01/react-19-2",
	},
	{
		label: "React Compiler",
		href: "https://react.dev/learn/react-compiler",
	},
	{
		label: "React Router data mode",
		href: "https://reactrouter.com/start/data/routing",
	},
	{
		label: "Module Federation",
		href: "https://module-federation.io/guide/start/",
	},
] as const;

const toneClassName = {
	stable: "border-success/20 bg-success/10 text-success",
	specialized: "border-primary/20 bg-primary/10 text-primary",
	watch: "border-warning/25 bg-warning/12 text-warning-foreground",
} as const satisfies Record<(typeof reactCapabilities)[number]["tone"], string>;

export function ArchitecturePlaybookPage() {
	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Architect track"
				title="React Frontend Architecture"
				summary="A compact decision map for React 19.2, Router boundaries, frontend platform governance, and microfrontends. Use it to decide what belongs in the app, what belongs in the platform, and what should stay a pilot."
				points={[
					{
						title: "React 19.2",
						detail:
							"Activity, Effect Events, cacheSignal, performance tracks, and pre-rendering are treated as architectural tools.",
					},
					{
						title: "Platform standards",
						detail:
							"Routes, state, performance, accessibility, and design tokens get explicit ownership.",
					},
					{
						title: "Microfrontends",
						detail: "Runtime federation is framed as an operating model, not just a bundler trick.",
					},
				]}
				links={docs.slice(0, 3)}
			/>

			<div className="flex flex-wrap gap-2">
				<TechPill name="react" />
				<TechPill name="react-router" />
				<TechPill name="typescript" />
				<TechPill name="better-auth" />
				<TechPill name="tanstack" />
				<TechPill name="drizzle" />
				<TechPill name="sqlite" />
				<TechPill name="shadcn" />
				<TechPill name="bun" />
			</div>

			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_360px]">
				<Card className="overflow-hidden border-border/60">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">React adoption map</Badge>
							<Badge variant="outline">Stable vs pilot vs watch</Badge>
						</div>
						<CardTitle>Use features as architectural levers</CardTitle>
						<CardDescription>
							Senior React work is mostly choosing the right boundary, not adding another hook.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-2">
						{reactCapabilities.map((item) => (
							<div key={item.name} className="app-muted-surface p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="font-semibold text-foreground">{item.name}</p>
									<Badge variant="outline" className={toneClassName[item.tone]}>
										{item.status}
									</Badge>
								</div>
								<p className="mt-3 text-sm leading-6 text-foreground">{item.call}</p>
								<div className="mt-4 grid gap-2 text-xs leading-5 text-muted-foreground">
									<p>
										<span className="font-medium text-foreground">Use:</span> {item.fit}
									</p>
									<p>
										<span className="font-medium text-foreground">Guardrail:</span> {item.risk}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<div className="grid gap-4">
					<Card className="border-border/60">
						<CardHeader>
							<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<Network className="size-5" />
							</div>
							<CardTitle>Frontend radar</CardTitle>
							<CardDescription>What to standardize, pilot, or watch.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{frontendRadar.map((group) => (
								<div key={group.label} className="app-surface p-4">
									<p className="text-sm font-medium text-foreground">{group.label}</p>
									<div className="mt-3 flex flex-wrap gap-2">
										{group.items.map((item) => (
											<Badge key={item} variant="outline">
												{item}
											</Badge>
										))}
									</div>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader>
							<CardTitle>Docs used</CardTitle>
							<CardDescription>Primary references for this track.</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-2">
							{docs.map((doc) => (
								<Button key={doc.href} asChild variant="outline" className="justify-between">
									<a href={doc.href} target="_blank" rel="noreferrer">
										{doc.label}
										<ArrowUpRight className="size-4" />
									</a>
								</Button>
							))}
						</CardContent>
					</Card>
				</div>
			</div>

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Operating model</Badge>
						<Badge variant="outline">Route, data, design, performance</Badge>
					</div>
					<CardTitle>Frontend architecture lanes</CardTitle>
					<CardDescription>
						The app stays maintainable when each lane has ownership and release criteria.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{architectureLanes.map((lane) => {
						const Icon = lane.icon;

						return (
							<div key={lane.title} className="app-surface p-4">
								<div className="flex items-start gap-3">
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<Icon className="size-5" />
									</div>
									<div className="min-w-0 space-y-2">
										<p className="font-semibold text-foreground">{lane.title}</p>
										<p className="text-sm leading-6 text-muted-foreground">{lane.own}</p>
										<p className="text-xs leading-5 text-foreground">{lane.standard}</p>
									</div>
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>

			<div className="grid gap-4 xl:grid-cols-[430px_minmax(0,1fr)]">
				<Card className="border-border/60">
					<CardHeader>
						<div className="flex size-11 items-center justify-center rounded-lg bg-accent/45 text-accent-foreground">
							<Split className="size-5" />
						</div>
						<CardTitle>Microfrontend decision rule</CardTitle>
						<CardDescription>
							Choose microfrontends for organizational scale, not because the UI feels large.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{microfrontendRules.map((rule) => (
							<div key={rule.title} className="app-muted-surface p-4">
								<p className="font-medium text-foreground">{rule.title}</p>
								<p className="mt-1 text-sm leading-6 text-muted-foreground">{rule.detail}</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Federated platform contract</Badge>
							<Badge variant="outline">Runtime + team boundaries</Badge>
						</div>
						<CardTitle>What has to be true before runtime federation</CardTitle>
						<CardDescription>
							Module Federation can work, but only with boring contracts and clear ownership.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-3 md:grid-cols-2">
							{platformContracts.map((contract, index) => (
								<div key={contract} className="app-surface p-4">
									<div className="flex items-start gap-3">
										<div
											className={cn(
												"flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
												index % 2 === 0
													? "bg-primary/10 text-primary"
													: "bg-accent/45 text-accent-foreground",
											)}
										>
											{index + 1}
										</div>
										<p className="text-sm leading-6 text-muted-foreground">{contract}</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<GitBranch className="size-5" />
					</div>
					<CardTitle>Architect-level review checklist</CardTitle>
					<CardDescription>
						Use this before adding a new route, state store, remote, or platform dependency.
					</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{[
						"Does the route own its data, pending state, and error recovery?",
						"Is the state local, URL-backed, server-derived, or truly shared?",
						"Can React Compiler safely reason about the component purity?",
						"Are Suspense, Activity, and transitions improving perceived speed?",
						"Can the shell survive a failed remote without a blank screen?",
						"Are a11y, focus recovery, reduced motion, and observability included?",
					].map((item) => (
						<div key={item} className="flex items-start gap-3 rounded-lg bg-muted/35 p-4">
							<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
							<p className="text-sm leading-6 text-muted-foreground">{item}</p>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
