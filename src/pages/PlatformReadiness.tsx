import { Activity as ReactActivity, useCallback, useEffect, useMemo, useState } from "react";

import {
	Activity,
	ArrowUpRight,
	BookOpenText,
	CheckCircle2,
	Database,
	Gauge,
	LockKeyhole,
	type LucideIcon,
	Route,
	Server,
	ShieldCheck,
	Workflow,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { TechLogo, type TechLogoName, TechPill } from "@/components/tech-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	docsLastCheckedLabel,
	docsPosture,
	getOfficialDocsByArea,
	officialDocLinks,
} from "@/lib/official-docs";

type ActivityLog = {
	id: number;
	label: string;
};

const platformSignals = [
	{
		title: "React 19.2 posture",
		status: "Current",
		icon: Activity,
		logo: "react",
		detail:
			"Activity, Effect Events, performance tracks, Actions, Suspense, and DOM APIs are taught as architectural choices.",
	},
	{
		title: "Router mode",
		status: "Data Mode",
		icon: Route,
		logo: "react-router",
		detail:
			"Route objects stay outside render, lazy route modules split the app, and the Bun server keeps deployment control.",
	},
	{
		title: "Auth boundary",
		status: "Hardened",
		icon: LockKeyhole,
		logo: "better-auth",
		detail:
			"Better Auth owns sessions, cookie caching, trusted origins, freshness, and rate limiting at the API edge.",
	},
	{
		title: "Runtime model",
		status: "Bun AOT",
		icon: Server,
		logo: "bun",
		detail:
			"Bun serves API routes and an ahead-of-time bundled React app from the same runtime with explicit cache policy.",
	},
] as const satisfies {
	title: string;
	status: string;
	icon: LucideIcon;
	logo: TechLogoName;
	detail: string;
}[];

const routerModeDecisions = [
	{
		mode: "Declarative",
		fit: "Small apps with an external data layer and minimal route data needs.",
		call: "Skip here because this studio teaches loaders, actions, pending UI, and route-level recovery.",
	},
	{
		mode: "Data",
		fit: "Apps that want router data primitives while keeping custom bundling, API, and server ownership.",
		call: "Current fit. Bun owns the server, React Router owns route state and navigation semantics.",
	},
	{
		mode: "Framework",
		fit: "Teams that want React Router to own route modules, SSR or SSG strategy, typegen, and conventions.",
		call: "Pilot when the app needs framework SSR, file routes, typed route modules, or React Router deploy presets.",
	},
] as const;

const upgradeChecklist = [
	{
		title: "Route contracts",
		icon: Route,
		items: [
			"Every protected route has auth-aware redirect behavior.",
			"Route code is split lazily without hiding errors behind a blank shell.",
			"Navigation pending state is visible at the app shell boundary.",
		],
	},
	{
		title: "Mutation model",
		icon: Workflow,
		items: [
			"Form actions, transitions, fetchers, and optimistic UI are taught as separate tools.",
			"Every optimistic path documents rollback and reconciliation.",
			"Router actions are the next upgrade path when mutations should revalidate route loaders.",
		],
	},
	{
		title: "Security posture",
		icon: ShieldCheck,
		items: [
			"Better Auth handles sessions on the server instead of trusting browser-only state.",
			"Trusted origins and rate limits are explicit configuration.",
			"Session freshness is short enough for sensitive operations to require recent sign-in.",
		],
	},
	{
		title: "Runtime delivery",
		icon: Gauge,
		items: [
			"Bun development uses HTML imports and hot reload.",
			"Production uses an ahead-of-time build with immutable assets and no-cache SPA documents.",
			"Asset paths are constrained to the dist directory before files are served.",
		],
	},
] as const;

const docAreas = [
	{ area: "react", label: "React" },
	{ area: "router", label: "React Router" },
	{ area: "auth", label: "Better Auth" },
	{ area: "bun", label: "Bun" },
	{ area: "ui", label: "UI System" },
	{ area: "platform", label: "Platform" },
] as const;

function ActivityPreview({ onLifecycle }: { onLifecycle: (event: string) => void }) {
	const [draft, setDraft] = useState("Keep route preview state warm.");

	useEffect(() => {
		onLifecycle("Preview effects mounted");
		return () => onLifecycle("Preview effects cleaned up");
	}, [onLifecycle]);

	return (
		<div className="app-muted-surface p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="font-medium text-foreground">Hidden route preview</p>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						State stays in memory while effects are paused when hidden.
					</p>
				</div>
				<Badge variant="secondary">Activity</Badge>
			</div>
			<textarea
				aria-label="Activity preview draft"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
				className="mt-4 min-h-24 w-full resize-none rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/40"
			/>
		</div>
	);
}

export function PlatformReadinessPage() {
	const [activityVisible, setActivityVisible] = useState(true);
	const [activityLog, setActivityLog] = useState<ActivityLog[]>([
		{ id: 1, label: "Activity lab ready" },
	]);
	const featuredDocs = useMemo(
		() =>
			officialDocLinks.filter((doc) =>
				[
					"React versions",
					"React Router v8 upgrade",
					"Better Auth sessions",
					"Bun full-stack",
				].includes(doc.label),
			),
		[],
	);

	const appendLifecycle = useCallback((label: string) => {
		setActivityLog((current) => [{ id: (current[0]?.id ?? 0) + 1, label }, ...current].slice(0, 5));
	}, []);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Experienced track"
				title="Platform Readiness Upgrade"
				summary="A source-backed review of the current React, React Router, Better Auth, and Bun choices. This page turns the docs into operating rules for senior frontend work."
				points={[
					{
						title: "React 19.2 as architecture",
						detail:
							"Activity, Effect Events, performance tracks, and Actions are evaluated by boundary and risk.",
					},
					{
						title: "Router mode clarity",
						detail: "The app intentionally uses React Router Data Mode with a custom Bun server.",
					},
					{
						title: "Runtime and auth posture",
						detail: "Bun delivery and Better Auth sessions are treated as production contracts.",
					},
				]}
				links={featuredDocs}
			/>

			<div className="flex flex-wrap gap-2">
				<TechPill name="react" />
				<TechPill name="react-router" />
				<TechPill name="better-auth" />
				<TechPill name="bun" />
				<TechPill name="drizzle" />
				<TechPill name="sqlite" />
				<TechPill name="typescript" />
			</div>

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex items-start justify-between gap-3">
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary">Docs freshness</Badge>
								<Badge variant="outline">Checked {docsLastCheckedLabel}</Badge>
							</div>
							<CardTitle className="mt-3">Latest-doc posture</CardTitle>
							<CardDescription>
								Version and docs claims are explicit so future upgrades have a review target.
							</CardDescription>
						</div>
						<div className="hidden size-11 items-center justify-center rounded-lg bg-accent/45 text-accent-foreground sm:flex">
							<BookOpenText className="size-5" />
						</div>
					</div>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					{docsPosture.map((item) => (
						<div key={item.title} className="app-muted-surface p-4">
							<Badge variant="outline">{item.status}</Badge>
							<p className="mt-3 font-semibold text-foreground">{item.title}</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{platformSignals.map((signal) => {
					const Icon = signal.icon;

					return (
						<Card key={signal.title} className="border-border/60">
							<CardContent className="space-y-4 pt-6">
								<div className="flex items-start justify-between gap-3">
									<span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<Icon className="size-5" />
									</span>
									<TechLogo name={signal.logo} className="size-5 opacity-80" />
								</div>
								<div>
									<Badge variant="outline">{signal.status}</Badge>
									<p className="mt-3 font-semibold text-foreground">{signal.title}</p>
									<p className="mt-2 text-sm leading-6 text-muted-foreground">{signal.detail}</p>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
				<Card className="border-border/60">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">React 19.2</Badge>
							<Badge variant="outline">Activity boundary</Badge>
						</div>
						<CardTitle>Preserve state without keeping effects alive</CardTitle>
						<CardDescription>
							Experienced teams should decide where hidden UI stays warm and where it should fully
							unmount.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
							<Button
								type="button"
								variant={activityVisible ? "default" : "outline"}
								onClick={() => setActivityVisible(true)}
							>
								Show Activity
							</Button>
							<Button
								type="button"
								variant={activityVisible ? "outline" : "default"}
								onClick={() => setActivityVisible(false)}
							>
								Hide Activity
							</Button>
						</div>

						<ReactActivity mode={activityVisible ? "visible" : "hidden"}>
							<ActivityPreview onLifecycle={appendLifecycle} />
						</ReactActivity>

						{activityVisible ? null : (
							<div className="app-muted-surface p-4 text-sm leading-6 text-muted-foreground">
								The preview is hidden by React Activity. Show it again to confirm the text draft is
								still preserved.
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Activity lifecycle log</CardTitle>
						<CardDescription>Effect behavior is the point of this demo.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{activityLog.map((event) => (
							<div key={event.id} className="app-surface flex items-center gap-3 px-3 py-2">
								<CheckCircle2 className="size-4 text-success" />
								<p className="text-sm text-muted-foreground">{event.label}</p>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
				<Card className="border-border/60">
					<CardHeader>
						<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Route className="size-5" />
						</div>
						<CardTitle>React Router mode decision</CardTitle>
						<CardDescription>
							React Router 8.1.0 documents three modes. This project deliberately lives in Data
							Mode.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{routerModeDecisions.map((decision) => (
							<div key={decision.mode} className="app-muted-surface p-4">
								<div className="flex items-center justify-between gap-3">
									<p className="font-semibold text-foreground">{decision.mode}</p>
									{decision.mode === "Data" ? <Badge variant="secondary">Current</Badge> : null}
								</div>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">{decision.fit}</p>
								<p className="mt-2 text-xs leading-5 text-foreground">{decision.call}</p>
							</div>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Upgrade checklist</Badge>
							<Badge variant="outline">Production learning standards</Badge>
						</div>
						<CardTitle>What experienced engineers should inspect</CardTitle>
						<CardDescription>
							These checks connect the docs to reviewable project behavior.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						{upgradeChecklist.map((group) => {
							const Icon = group.icon;

							return (
								<div key={group.title} className="app-surface p-4">
									<div className="flex items-center gap-3">
										<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<Icon className="size-5" />
										</span>
										<p className="font-semibold text-foreground">{group.title}</p>
									</div>
									<div className="mt-4 space-y-3">
										{group.items.map((item) => (
											<div key={item} className="flex items-start gap-2">
												<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
												<p className="text-sm leading-6 text-muted-foreground">{item}</p>
											</div>
										))}
									</div>
								</div>
							);
						})}
					</CardContent>
				</Card>
			</div>

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<div>
							<CardTitle>Official reference matrix</CardTitle>
							<CardDescription>
								Primary docs used to keep the studio current and avoid cargo-cult examples.
							</CardDescription>
						</div>
						<div className="hidden size-11 items-center justify-center rounded-lg bg-accent/45 text-accent-foreground sm:flex">
							<Database className="size-5" />
						</div>
					</div>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{docAreas.map((group) => (
						<div key={group.area} className="app-muted-surface p-4">
							<p className="font-semibold text-foreground">{group.label}</p>
							<div className="mt-3 space-y-2">
								{getOfficialDocsByArea(group.area)
									.slice(0, 5)
									.map((doc) => (
										<a
											key={doc.href}
											href={doc.href}
											target="_blank"
											rel="noreferrer"
											className="group flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/65 p-3 text-sm transition-colors hover:bg-muted/60"
										>
											<span>
												<span className="block font-medium text-foreground">{doc.label}</span>
												<span className="mt-1 block text-xs leading-5 text-muted-foreground">
													{doc.description}
												</span>
											</span>
											<ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
										</a>
									))}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
