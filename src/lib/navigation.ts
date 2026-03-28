import {
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

export type LearningStage =
	| "foundation"
	| "hands-on"
	| "platform"
	| "full-stack";

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
	label: "Bun + React Lab",
	title: "Interface Studio",
	description:
		"A themed sandbox for React 19, server-side data flows, and polished component work built on shadcn-style tokens.",
	icon: FlaskConical,
};

export const navItems: [NavItem, ...NavItem[]] = [
	{
		path: "/react-19",
		label: "React 19 Overview",
		blurb: "Release notes mapped to concrete pages in the app.",
		icon: Sparkles,
		stage: "foundation",
		releaseArea: "Overview",
		apiLabels: ["Actions", "use", "DOM APIs"],
	},
	{
		path: "/form-actions",
		label: "Form Actions",
		blurb: "Function actions, pending state, and returned UI state.",
		icon: FilePenLine,
		stage: "hands-on",
		releaseArea: "Actions",
		apiLabels: ["useActionState", "useFormStatus", "<form action>"],
	},
	{
		path: "/actions",
		label: "Async Actions",
		blurb: "Button-driven mutations with transitions and feedback.",
		icon: Workflow,
		stage: "hands-on",
		releaseArea: "Actions",
		apiLabels: ["startTransition"],
	},
	{
		path: "/optimistic",
		label: "Optimistic UI",
		blurb: "Immediate UI moves with clean success and rollback behavior.",
		icon: Rocket,
		stage: "hands-on",
		releaseArea: "Actions",
		apiLabels: ["useOptimistic"],
	},
	{
		path: "/react-use",
		label: "use + Suspense",
		blurb: "Promises and conditional context reads during render.",
		icon: Orbit,
		stage: "hands-on",
		releaseArea: "use API",
		apiLabels: ["use", "Suspense", "<Context>"],
	},
	{
		path: "/dom-interop",
		label: "DOM + Head APIs",
		blurb: "Metadata, refs, and custom element interop in React 19.",
		icon: PanelTopOpen,
		stage: "platform",
		releaseArea: "DOM APIs",
		apiLabels: ["<title>", "ref cleanup", "Custom Elements"],
	},
	{
		path: "/search-debounce",
		label: "Search + Deferred",
		blurb: "Local customer autocomplete shaped with useDeferredValue and Bun.",
		icon: Search,
		stage: "hands-on",
		releaseArea: "Performance",
		apiLabels: ["useDeferredValue", "debounce", "Bun API"],
	},
	{
		path: "/revenue-ops",
		label: "Revenue Ops",
		blurb: "Server-side table state powered by Bun, Drizzle, and SQLite.",
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
		relatedPaths: ["/react-19", "/dom-interop"],
	},
] as const;

export const learningStages: Record<LearningStage, string> = {
	foundation: "Start here",
	"hands-on": "Build intuition",
	platform: "Platform details",
	"full-stack": "Applied example",
};
