import {
	ArrowRight,
	ArrowUpRight,
	BookOpenText,
	CheckCircle2,
	type LucideIcon,
	Server,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { FeatureIntro } from "@/components/feature-intro";
import { TechLogo, TechPill } from "@/components/tech-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { learningStages, navItems, releaseCoverage } from "@/lib/navigation";

const learningRoutes = navItems.filter((item) => item.path !== "/react-19");
const navItemsByPath = Object.fromEntries(navItems.map((item) => [item.path, item]));

const stackHighlights = [
	{
		title: "React 19 stable APIs",
		description:
			"Core features are mapped to runnable routes instead of long release-note summaries.",
		icon: CheckCircle2,
	},
	{
		title: "shadcn/ui composition",
		description: "Shared primitives keep the UI consistent without overbuilding every screen.",
		icon: BookOpenText,
	},
	{
		title: "Bun full-stack shape",
		description:
			"Bun remains visible in the product instead of disappearing behind frontend-only demos.",
		icon: Server,
	},
] as const satisfies {
	title: string;
	description: string;
	icon: LucideIcon;
}[];

const docsStack = [
	{
		title: "React",
		subtitle: "Release notes + API docs",
		description:
			"The overview and demo pages are organized around the stable React 19 release post and the hook/component references it points to.",
		href: "https://react.dev/blog/2024/12/05/react-19",
		logo: "react",
	},
	{
		title: "shadcn/ui",
		subtitle: "Current component patterns",
		description:
			"The UI layer leans on the current command/dialog/card primitives and the repo's Tailwind v4-style token setup in components.json.",
		href: "https://ui.shadcn.com/docs/components/command",
		logo: "shadcn",
	},
	{
		title: "Bun",
		subtitle: "Full-stack routes + HTML imports",
		description:
			"The server/runtime side mirrors Bun's current docs around routes, development mode, and HTML-import-based frontend bundling.",
		href: "https://bun.sh/docs/bundler/fullstack",
		logo: "bun",
	},
] as const satisfies {
	title: string;
	subtitle: string;
	description: string;
	href: string;
	logo: "react" | "shadcn" | "bun";
}[];

const bunPractices = [
	"`src/index.ts` uses Bun route objects and parameterized API handlers.",
	"`bunfig.toml` enables the Tailwind plugin under `[serve.static]`.",
	"`src/index.html` stays the frontend entry while Bun owns serving and bundling.",
] as const;

export function React19OverviewPage() {
	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Release Notes Tour"
				summary="A quick map of the React 19 features this repo actually demonstrates. Start here, then move into the focused routes below."
				points={[
					{
						title: "Learn from the release, not from random demos",
						detail:
							"Each route is tagged by release area and learning stage so you can move from overview to hands-on examples in a deliberate order.",
					},
					{
						title: "UI primitives now support the teaching goal",
						detail:
							"The command palette, badges, cards, and shell stats are all built from reusable shadcn-style primitives rather than bespoke one-off markup.",
					},
					{
						title: "Bun is part of the story",
						detail:
							"The app exposes Bun's route model, HTML-import setup, and server-side data flow so the repo reads as a full-stack lab instead of only a frontend sandbox.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "shadcn docs",
						href: "https://ui.shadcn.com/docs/components/command",
					},
					{
						label: "Bun fullstack docs",
						href: "https://bun.sh/docs/bundler/fullstack",
					},
				]}
			/>

			<div className="flex flex-wrap gap-2">
				<TechPill name="react" />
				<TechPill name="react-router" />
				<TechPill name="bun" />
				<TechPill name="shadcn" />
				<TechPill name="typescript" />
				<TechPill name="better-auth" />
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>React 19 coverage map</CardTitle>
						<CardDescription>Where each release area shows up in the app.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2">
						{releaseCoverage.map((item) => (
							<div key={item.title} className="app-muted-surface p-4">
								<div className="flex flex-wrap items-center gap-2">
									<p className="font-medium text-foreground">{item.title}</p>
									<Badge variant="secondary">{item.status}</Badge>
								</div>
								<div className="mt-4 flex flex-wrap gap-2">
									{item.relatedPaths.map((path) => {
										const route = navItemsByPath[path];
										if (!route) {
											return null;
										}

										return (
											<Button
												key={path}
												asChild
												variant="outline"
												size="sm"
												className="rounded-full"
											>
												<NavLink to={path}>
													{route.label}
													<ArrowRight className="size-4" />
												</NavLink>
											</Button>
										);
									})}
								</div>
							</div>
						))}
					</CardContent>
				</Card>

				<div className="grid gap-4">
					<Card className="border-border/60">
						<CardHeader>
							<CardTitle>Current stack adoption</CardTitle>
							<CardDescription>Three choices driving the redesign.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{stackHighlights.map((item) => {
								const Icon = item.icon;

								return (
									<div key={item.title} className="app-surface p-4">
										<div className="flex items-start gap-3">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
												<Icon className="size-5" />
											</div>
											<div className="space-y-1">
												<p className="font-medium text-foreground">{item.title}</p>
												<p className="text-sm leading-6 text-muted-foreground">
													{item.description}
												</p>
											</div>
										</div>
									</div>
								);
							})}
						</CardContent>
					</Card>

					<Card className="border-border/60">
						<CardHeader>
							<CardTitle>Bun practices in this repo</CardTitle>
							<CardDescription>Implementation cues worth noticing.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{bunPractices.map((practice) => (
								<div
									key={practice}
									className="app-muted-surface p-3 text-sm leading-6 text-muted-foreground"
								>
									{practice}
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-2">
				{learningRoutes.map((route) => {
					const Icon = route.icon;

					return (
						<Card
							key={route.path}
							className="group border-border/60 transition-all duration-200 hover:-translate-y-1 hover:border-primary/20"
						>
							<CardHeader>
								<div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<Icon className="size-5" />
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<CardTitle>{route.label}</CardTitle>
									<Badge variant="outline">{route.releaseArea}</Badge>
									<Badge variant="secondary">{learningStages[route.stage]}</Badge>
								</div>
								<CardDescription>{route.blurb}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-wrap gap-2">
									{route.apiLabels.map((api) => (
										<Badge key={api} variant="outline">
											{api}
										</Badge>
									))}
								</div>
								<Button asChild variant="outline">
									<NavLink to={route.path}>
										Open page
										<ArrowRight className="size-4" />
									</NavLink>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				{docsStack.map((item) => {
					return (
						<Card key={item.href} className="border-border/60">
							<CardHeader>
								<div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent/45 text-accent-foreground">
									<TechLogo name={item.logo} className="size-5" />
								</div>
								<CardTitle>{item.title}</CardTitle>
								<CardDescription>{item.subtitle}</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
								<Button asChild variant="outline">
									<a href={item.href} target="_blank" rel="noreferrer">
										Open docs
										<ArrowUpRight className="size-4" />
									</a>
								</Button>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
