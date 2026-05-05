import {
	BrainCircuit,
	ChartColumnIncreasing,
	FilePenLine,
	FlaskConical,
	type LucideIcon,
	Orbit,
	PanelTopOpen,
	Rocket,
	Search,
	Sparkles,
	Workflow,
} from "lucide-react";

export type LearningStage = "foundation" | "hands-on" | "platform" | "full-stack";

export type NavItem = {
	path: string;
	label: string;
	blurb: string;
	icon: LucideIcon;
	stage: LearningStage;
	releaseArea: string;
	apiLabels: string[];
};

export const appIdentity = {
	label: "Bun Frontend Systems",
	title: "React Systems Studio",
	description:
		"A clean learning workspace for modern React, Bun fullstack APIs, data flows, and production-grade UI patterns.",
	icon: FlaskConical,
};

export const navItems: [NavItem, ...NavItem[]] = [
	{
		path: "/overview",
		label: "Overview",
		blurb: "A compact map of the React, Bun, and UI patterns covered in this workspace.",
		icon: Sparkles,
		stage: "foundation",
		releaseArea: "Overview",
		apiLabels: ["Actions", "use", "DOM APIs"],
	},
	{
		path: "/architecture",
		label: "Architecture Playbook",
		blurb: "Senior React, Router, platform, and microfrontend decisions without filler.",
		icon: BrainCircuit,
		stage: "platform",
		releaseArea: "Architecture",
		apiLabels: ["Activity", "Compiler", "Microfrontends"],
	},
	{
		path: "/form-actions",
		label: "Form Actions",
		blurb: "Form mutations with pending, success, and returned state.",
		icon: FilePenLine,
		stage: "hands-on",
		releaseArea: "Actions",
		apiLabels: ["useActionState", "useFormStatus", "<form action>"],
	},
	{
		path: "/actions",
		label: "Async Actions",
		blurb: "Button mutations shaped with transitions and feedback.",
		icon: Workflow,
		stage: "hands-on",
		releaseArea: "Actions",
		apiLabels: ["startTransition"],
	},
	{
		path: "/optimistic",
		label: "Optimistic UI",
		blurb: "Fast UI updates with clear success and rollback paths.",
		icon: Rocket,
		stage: "hands-on",
		releaseArea: "Actions",
		apiLabels: ["useOptimistic"],
	},
	{
		path: "/react-use",
		label: "use + Suspense",
		blurb: "Promise reads, Suspense boundaries, and conditional context.",
		icon: Orbit,
		stage: "hands-on",
		releaseArea: "use API",
		apiLabels: ["use", "Suspense", "<Context>"],
	},
	{
		path: "/dom-interop",
		label: "DOM + Head APIs",
		blurb: "Metadata, refs, assets, and custom elements in React 19.",
		icon: PanelTopOpen,
		stage: "platform",
		releaseArea: "DOM APIs",
		apiLabels: ["<title>", "ref cleanup", "Custom Elements"],
	},
	{
		path: "/search-debounce",
		label: "Search + Deferred",
		blurb: "Deferred search UX backed by a real Bun endpoint.",
		icon: Search,
		stage: "hands-on",
		releaseArea: "Performance",
		apiLabels: ["useDeferredValue", "debounce", "Bun API"],
	},
	{
		path: "/revenue-ops",
		label: "Revenue Ops",
		blurb: "Server-side table state with Bun, Drizzle, and SQLite.",
		icon: ChartColumnIncreasing,
		stage: "full-stack",
		releaseArea: "Applied app",
		apiLabels: ["TanStack Table", "Drizzle", "Bun"],
	},
];

export const releaseCoverage = [
	{
		title: "Actions",
		status: "Deep demo coverage",
		detail:
			"Form actions, async transitions, and optimistic updates each have dedicated pages with teaching-oriented UI.",
		relatedPaths: ["/form-actions", "/actions", "/optimistic"],
	},
	{
		title: "Architecture posture",
		status: "Senior track",
		detail:
			"React 19.2, Router boundaries, platform standards, and microfrontend tradeoffs are captured as decision guides.",
		relatedPaths: ["/architecture"],
	},
	{
		title: "use",
		status: "Interactive demo",
		detail:
			"Promise reads, Suspense fallbacks, and conditional context reads are shown together so the mental model stays coherent.",
		relatedPaths: ["/react-use"],
	},
	{
		title: "DOM APIs",
		status: "Interactive demo",
		detail:
			"Head tags, ref as a prop, cleanup callbacks, and custom element property assignment are demonstrated in one route.",
		relatedPaths: ["/dom-interop"],
	},
	{
		title: "useDeferredValue initial value",
		status: "Pattern demo",
		detail:
			"The search page shows why deferred values still need normal UX shaping like debouncing, now backed by a real Bun autocomplete endpoint.",
		relatedPaths: ["/search-debounce"],
	},
	{
		title: "Static APIs, asset loading, diagnostics",
		status: "Reference callout",
		detail:
			"These release-note items are captured in the overview and DOM pages so the project stays broad without adding filler routes.",
		relatedPaths: ["/overview", "/dom-interop"],
	},
] as const;

export const learningStages: Record<LearningStage, string> = {
	foundation: "Start here",
	"hands-on": "Build intuition",
	platform: "Platform details",
	"full-stack": "Applied example",
};
