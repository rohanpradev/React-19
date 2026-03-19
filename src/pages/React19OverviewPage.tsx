import {
	ArrowRight,
	ChartColumnIncreasing,
	FilePenLine,
	type LucideIcon,
	Orbit,
	PanelTopOpen,
	Rocket,
	Search,
	Workflow,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { FeatureIntro } from "@/components/feature-intro";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const featureRoutes = [
	{
		title: "Form Actions",
		description:
			"See how useActionState and useFormStatus turn a form action into a single source of truth for validation, pending state, and returned UI state.",
		path: "/form-actions",
		icon: FilePenLine,
	},
	{
		title: "Async Actions",
		description:
			"Review React 19's action model through startTransition for mutations that are not primarily form-driven.",
		path: "/actions",
		icon: Workflow,
	},
	{
		title: "use + Suspense",
		description:
			"Read a Promise during render, suspend naturally, and compare it with context reads that can happen conditionally.",
		path: "/react-use",
		icon: Orbit,
	},
	{
		title: "Optimistic UI",
		description:
			"Show a result immediately while the mutation is still in flight, then commit or roll back based on the server response.",
		path: "/optimistic",
		icon: Rocket,
	},
	{
		title: "DOM + Head APIs",
		description:
			"Cover the platform side of React 19: document metadata, ref as a prop, ref cleanup callbacks, and improved custom element interoperability.",
		path: "/dom-interop",
		icon: PanelTopOpen,
	},
	{
		title: "Search + Deferred",
		description:
			"Pair debouncing with the new useDeferredValue initial value so the input stays immediate while slower search work lags behind.",
		path: "/search-debounce",
		icon: Search,
	},
	{
		title: "Revenue Ops",
		description:
			"A full-stack page in this repo that combines Bun, Drizzle, and server-side table state outside the React 19-specific demos.",
		path: "/revenue-ops",
		icon: ChartColumnIncreasing,
	},
] as const satisfies {
	title: string;
	description: string;
	path: string;
	icon: LucideIcon;
}[];

const otherReleaseItems = [
	"useDeferredValue now accepts an initial value for the first render",
	"<Context> can be rendered directly as a provider",
	"Stylesheet support adds precedence-aware loading from components",
	"Async scripts can be deduplicated from the React tree",
	"preload, preinit, preconnect, and prefetchDNS help resource scheduling",
	"Hydration diagnostics and root-level error hooks are more actionable",
] as const;

export function React19OverviewPage() {
	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Release Notes Tour"
				summary="This section maps the official React 19 release notes to examples in the app. The tour covers actions, form hooks, optimistic updates, the new use API, and the DOM-level improvements that make React easier to use as a platform tool, not only a component library."
				points={[
					{
						title: "Actions are the center of the release",
						detail:
							"React 19 formalizes async transitions and form actions so pending UI, optimistic work, and returned state fit one mental model.",
					},
					{
						title: "use expands render-time data access",
						detail:
							"The new use API can read Promises and context during render, integrates with Suspense, and can be called conditionally.",
					},
					{
						title: "DOM integration got sharper too",
						detail:
							"Metadata, stylesheets, refs, scripts, and Custom Elements all received quality-of-life upgrades that make React friendlier outside pure component logic.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
				]}
			/>

			<div className="grid gap-4 lg:grid-cols-2">
				{featureRoutes.map((feature) => (
					<Card
						key={feature.path}
						className="group border-border/60 transition-all duration-200 hover:-translate-y-1 hover:border-primary/20"
					>
						<CardHeader>
							<div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<feature.icon className="size-5" />
							</div>
							<CardTitle>{feature.title}</CardTitle>
							<CardDescription className="leading-6">
								{feature.description}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild variant="outline">
								<NavLink to={feature.path}>
									Open page
									<ArrowRight className="size-4" />
								</NavLink>
							</Button>
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="border-border/60">
				<CardHeader>
					<CardTitle>Also in the React 19 release</CardTitle>
					<CardDescription className="leading-6">
						These also ship in the release notes. Some are called out on the
						pages above, while others are noted here so the tour stays broad
						without turning every item into its own route.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="space-y-3 text-sm text-muted-foreground">
						{otherReleaseItems.map((item) => (
							<li
								key={item}
								className="rounded-2xl border border-border/60 bg-muted/35 p-3"
							>
								{item}
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}
