import {
	BrainCircuit,
	ChartColumnIncreasing,
	ClipboardCheck,
	CloudUpload,
	DatabaseZap,
	FilePenLine,
	FlaskConical,
	Gauge,
	LayoutDashboard,
	ListTree,
	type LucideIcon,
	Orbit,
	PanelsTopLeft,
	PanelTopOpen,
	RadioTower,
	Rocket,
	Search,
	Sparkles,
	UserRound,
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
		"A focused workspace for modern React, routing, UI systems, and Bun-backed data flows.",
	icon: FlaskConical,
};

export const navItems: [NavItem, ...NavItem[]] = [
	{
		path: "/overview",
		label: "Overview",
		blurb: "The map of React, Router, Bun, and UI topics in this workspace.",
		icon: Sparkles,
		stage: "foundation",
		releaseArea: "Overview",
		apiLabels: ["Actions", "use", "DOM APIs"],
	},
	{
		path: "/architecture",
		label: "Architecture Playbook",
		blurb: "Senior React, Router, platform, and microfrontend decisions.",
		icon: BrainCircuit,
		stage: "platform",
		releaseArea: "Architecture",
		apiLabels: ["Activity", "Compiler", "Microfrontends"],
	},
	{
		path: "/platform-readiness",
		label: "Platform Readiness",
		blurb: "Source-backed upgrade posture for React, Router, Better Auth, and Bun.",
		icon: Gauge,
		stage: "platform",
		releaseArea: "Upgrade track",
		apiLabels: ["Activity", "Data Mode", "Bun.serve", "Sessions"],
	},
	{
		path: "/control-room",
		label: "Control Room",
		blurb: "Signal-style external store, context injection, command logs, and error boundaries.",
		icon: RadioTower,
		stage: "platform",
		releaseArea: "State architecture",
		apiLabels: ["useSyncExternalStore", "Context", "Error Boundary"],
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
		blurb: "Fast UI updates with success and rollback paths.",
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
		blurb: "Metadata, refs, assets, and custom elements.",
		icon: PanelTopOpen,
		stage: "platform",
		releaseArea: "DOM APIs",
		apiLabels: ["<title>", "ref cleanup", "Custom Elements"],
	},
	{
		path: "/search-debounce",
		label: "Search + Deferred",
		blurb: "Deferred search UX backed by a Bun endpoint.",
		icon: Search,
		stage: "hands-on",
		releaseArea: "Performance",
		apiLabels: ["useDeferredValue", "debounce", "Bun API"],
	},
	{
		path: "/virtual-explorer",
		label: "Virtual Explorer",
		blurb: "High-volume entity browsing with deferred filters and a virtual row window.",
		icon: ListTree,
		stage: "hands-on",
		releaseArea: "Performance",
		apiLabels: ["useDeferredValue", "useTransition", "ref cleanup"],
	},
	{
		path: "/workflow-board",
		label: "Workflow Board",
		blurb: "Sortable drag-and-drop prioritization with dnd-kit and shadcn-style UI.",
		icon: LayoutDashboard,
		stage: "hands-on",
		releaseArea: "Interaction",
		apiLabels: ["dnd-kit", "SortableContext", "KeyboardSensor"],
	},
	{
		path: "/intake-form",
		label: "Intake Form",
		blurb: "Complex form validation with TanStack Form, Valibot, and shadcn controls.",
		icon: ClipboardCheck,
		stage: "hands-on",
		releaseArea: "Forms",
		apiLabels: ["TanStack Form", "Valibot", "Schema validation"],
	},
	{
		path: "/upload-manager",
		label: "Upload Manager",
		blurb:
			"Enterprise file intake with validation, optimistic queueing, progress, retry, and cancel.",
		icon: CloudUpload,
		stage: "hands-on",
		releaseArea: "File workflows",
		apiLabels: ["useOptimistic", "useEffectEvent", "File API"],
	},
	{
		path: "/workbench-layout",
		label: "Workbench Layout",
		blurb: "Resizable enterprise shell with accessible splitters and Activity-preserved panels.",
		icon: PanelsTopLeft,
		stage: "platform",
		releaseArea: "Enterprise shell",
		apiLabels: ["Activity", "useTransition", "ARIA splitter"],
	},
	{
		path: "/server-state",
		label: "Server State",
		blurb: "TanStack Query cache, optimistic mutation, rollback, and Bun invalidation.",
		icon: DatabaseZap,
		stage: "full-stack",
		releaseArea: "Server state",
		apiLabels: ["TanStack Query", "Optimistic updates", "Bun API"],
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

export const accountNavItem = {
	path: "/account",
	label: "Account Center",
	blurb: "Profile, password, and active session controls for the signed-in user.",
	icon: UserRound,
	stage: "full-stack",
	releaseArea: "Account security",
	apiLabels: ["updateUser", "changePassword", "Sessions"],
} satisfies NavItem;

export const workspaceNavItems = [accountNavItem] as const;

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
			"React 19.3, Router boundaries, platform standards, upgrade posture, and microfrontend tradeoffs are captured as decision guides.",
		relatedPaths: ["/architecture", "/platform-readiness"],
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
			"The search and virtual explorer pages show why deferred values still need normal UX shaping like debouncing, bounded rendering, and clear pending states.",
		relatedPaths: ["/search-debounce", "/virtual-explorer"],
	},
	{
		title: "Library-backed interaction patterns",
		status: "New advanced demos",
		detail:
			"dnd-kit, TanStack Form, Valibot, and TanStack Query show drag/drop, schema forms, and server-state cache workflows without hand-rolled infrastructure.",
		relatedPaths: ["/workflow-board", "/intake-form", "/server-state"],
	},
	{
		title: "Enterprise reusable UI surfaces",
		status: "High-impact additions",
		detail:
			"Virtualized browsing, upload queue management, and resizable workbench layouts round out common enterprise product surfaces beyond tables and forms.",
		relatedPaths: ["/virtual-explorer", "/upload-manager", "/workbench-layout"],
	},
	{
		title: "State architecture and error recovery",
		status: "Expert showcase",
		detail:
			"The control room route demonstrates signal-style external state, context as dependency injection, command writes, derived snapshots, and recoverable render boundaries.",
		relatedPaths: ["/control-room"],
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
