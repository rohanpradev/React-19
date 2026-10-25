import {
	Activity,
	type CSSProperties,
	type KeyboardEvent,
	type PointerEvent as ReactPointerEvent,
	useId,
	useMemo,
	useRef,
	useState,
	useTransition,
} from "react";

import {
	CheckCircle2,
	Columns3,
	DatabaseZap,
	ListChecks,
	type LucideIcon,
	PanelsTopLeft,
	SlidersHorizontal,
	SquareKanban,
	StickyNote,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type WorkspaceId = "triage" | "pipeline" | "audit";

type WorkbenchItem = {
	id: WorkspaceId;
	label: string;
	status: string;
	owner: string;
	description: string;
	metrics: Array<{
		label: string;
		value: string;
	}>;
};

const minRailWidth = 210;
const maxRailWidth = 360;
const minInspectorWidth = 260;
const maxInspectorWidth = 460;

const workspaces: [WorkbenchItem, ...WorkbenchItem[]] = [
	{
		id: "triage",
		label: "Account Triage",
		status: "Live queue",
		owner: "Revenue Ops",
		description:
			"Prioritize high-value customer signals before account owners enter renewal calls.",
		metrics: [
			{ label: "Signals", value: "42" },
			{ label: "SLA", value: "2h" },
			{ label: "Risk", value: "18%" },
		],
	},
	{
		id: "pipeline",
		label: "Launch Pipeline",
		status: "Planning",
		owner: "Platform PMO",
		description: "Track dependencies between design system, data, auth, and release readiness.",
		metrics: [
			{ label: "Blocked", value: "3" },
			{ label: "Ready", value: "12" },
			{ label: "Scope", value: "89%" },
		],
	},
	{
		id: "audit",
		label: "Security Audit",
		status: "Review",
		owner: "AppSec",
		description: "Review access, sessions, data export behavior, and policy acknowledgement.",
		metrics: [
			{ label: "Checks", value: "31" },
			{ label: "Open", value: "5" },
			{ label: "Pass", value: "84%" },
		],
	},
];

export function WorkbenchLayoutPage() {
	const railId = useId();
	const inspectorId = useId();
	const [leftOpen, setLeftOpen] = useState(true);
	const [inspectorOpen, setInspectorOpen] = useState(true);
	const [leftWidth, setLeftWidth] = useState(280);
	const [inspectorWidth, setInspectorWidth] = useState(340);
	const [workspaceId, setWorkspaceId] = useState<WorkspaceId>("triage");
	const [isPending, startTransition] = useTransition();
	const activeWorkspace =
		workspaces.find((workspace) => workspace.id === workspaceId) ?? workspaces[0];
	const gridTemplateColumns = `${leftOpen ? `${leftWidth}px` : "0px"} ${
		leftOpen ? "10px" : "0px"
	} minmax(0,1fr) ${inspectorOpen ? "10px" : "0px"} ${
		inspectorOpen ? `${inspectorWidth}px` : "0px"
	}`;
	const totalContext = useMemo(
		() => workspaces.reduce((total, workspace) => total + workspace.metrics.length, 0),
		[],
	);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Enterprise UI pattern"
				title="Resizable Workbench Layout"
				summary="An IDE-style workspace shell with keyboard-accessible splitters, Activity-preserved side panels, transition-based workspace switching, and stable panel constraints."
				points={[
					{
						title: "Accessible splitters",
						detail:
							"Separators expose role, orientation, value, pointer drag, and arrow-key resizing.",
					},
					{
						title: "Activity boundaries",
						detail:
							"Hidden rail and inspector content preserve local state while effects are paused.",
					},
					{
						title: "Transition updates",
						detail: "Workspace switches are scheduled so the shell remains responsive.",
					},
				]}
				links={[
					{
						label: "Activity",
						href: "https://react.dev/reference/react/Activity",
					},
					{
						label: "useTransition",
						href: "https://react.dev/reference/react/useTransition",
					},
					{
						label: "WAI splitter",
						href: "https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/",
					},
					{
						label: "react-resizable-panels",
						href: "https://github.com/bvaughn/react-resizable-panels",
					},
				]}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Workspace routes"
					value={String(workspaces.length)}
					detail="Stateful areas in one shell"
					icon={PanelsTopLeft}
				/>
				<MetricCard
					label="Rail width"
					value={`${leftWidth}px`}
					detail={leftOpen ? "Navigation visible" : "Navigation hidden"}
					icon={Columns3}
				/>
				<MetricCard
					label="Inspector width"
					value={`${inspectorWidth}px`}
					detail={inspectorOpen ? "Inspector visible" : "Inspector hidden"}
					icon={SlidersHorizontal}
				/>
				<MetricCard
					label="Context fields"
					value={String(totalContext)}
					detail="Across all workspaces"
					icon={DatabaseZap}
				/>
			</div>

			<Card className="overflow-hidden border-border/60">
				<CardHeader className="gap-4 border-b border-border/60">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<CardTitle>Workbench shell</CardTitle>
							<CardDescription>
								Resize panes with pointer drag or arrow keys. Hide panels and reopen them to verify
								their local notes are preserved.
							</CardDescription>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant={isPending ? "secondary" : "outline"}>
								{isPending ? "Switching workspace" : "Workspace settled"}
							</Badge>
							<Button
								type="button"
								variant={leftOpen ? "secondary" : "outline"}
								size="sm"
								aria-controls={railId}
								aria-expanded={leftOpen}
								onClick={() => setLeftOpen((value) => !value)}
							>
								{leftOpen ? "Hide rail" : "Show rail"}
							</Button>
							<Button
								type="button"
								variant={inspectorOpen ? "secondary" : "outline"}
								size="sm"
								aria-controls={inspectorId}
								aria-expanded={inspectorOpen}
								onClick={() => setInspectorOpen((value) => !value)}
							>
								{inspectorOpen ? "Hide inspector" : "Show inspector"}
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="pt-6">
					<div
						className="grid grid-cols-1 overflow-hidden rounded-lg border border-border/70 bg-card/80 lg:h-[640px] lg:[grid-template-columns:var(--workbench-columns)]"
						style={{ "--workbench-columns": gridTemplateColumns } as CSSProperties}
					>
						<div id={railId} className="min-w-0 overflow-hidden lg:col-start-1 lg:row-start-1">
							<Activity mode={leftOpen ? "visible" : "hidden"}>
								<WorkspaceRail
									activeId={workspaceId}
									onSelect={(nextId) => {
										startTransition(() => setWorkspaceId(nextId));
									}}
								/>
							</Activity>
						</div>

						<div className="hidden min-w-0 lg:col-start-2 lg:row-start-1 lg:block">
							{leftOpen ? (
								<ResizeHandle
									label="Resize navigation rail"
									controls={railId}
									value={leftWidth}
									min={minRailWidth}
									max={maxRailWidth}
									onDelta={(delta) =>
										setLeftWidth((value) => clamp(value + delta, minRailWidth, maxRailWidth))
									}
									onNudge={(delta) =>
										setLeftWidth((value) => clamp(value + delta, minRailWidth, maxRailWidth))
									}
								/>
							) : null}
						</div>

						<WorkspaceCanvas workspace={activeWorkspace} />

						<div className="hidden min-w-0 lg:col-start-4 lg:row-start-1 lg:block">
							{inspectorOpen ? (
								<ResizeHandle
									label="Resize inspector"
									controls={inspectorId}
									reversed
									value={inspectorWidth}
									min={minInspectorWidth}
									max={maxInspectorWidth}
									onDelta={(delta) =>
										setInspectorWidth((value) =>
											clamp(value - delta, minInspectorWidth, maxInspectorWidth),
										)
									}
									onNudge={(delta) =>
										setInspectorWidth((value) =>
											clamp(value - delta, minInspectorWidth, maxInspectorWidth),
										)
									}
								/>
							) : null}
						</div>

						<div id={inspectorId} className="min-w-0 overflow-hidden lg:col-start-5 lg:row-start-1">
							<Activity mode={inspectorOpen ? "visible" : "hidden"}>
								<InspectorPanel workspace={activeWorkspace} />
							</Activity>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Reusable component standard</Badge>
						<Badge variant="outline">Enterprise shell behavior</Badge>
					</div>
					<CardTitle>What this teaches beyond layout</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
					{[
						"Splitters need keyboard behavior and ARIA values, not just pointer dragging.",
						"Panel sizes should be constrained so small screens and dense data cannot break the shell.",
						"Activity is useful for hiding stateful work surfaces without losing local drafts.",
						"Workspace transitions should not block shell controls or global navigation.",
						"Main content must remain useful when either side panel is hidden.",
						"Panel state is a product contract and can later persist to local storage or user settings.",
					].map((item) => (
						<div key={item} className="app-muted-surface flex items-start gap-3 p-4">
							<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
							<p className="text-sm leading-6 text-muted-foreground">{item}</p>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function WorkspaceRail({
	activeId,
	onSelect,
}: {
	activeId: WorkspaceId;
	onSelect: (id: WorkspaceId) => void;
}) {
	const [railNote, setRailNote] = useState("Filter: show high-impact work first.");

	return (
		<div className="flex h-full flex-col border-r border-border/60 bg-muted/25 p-4">
			<div className="flex items-center gap-3">
				<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<ListChecks className="size-5" />
				</span>
				<div className="min-w-0">
					<p className="truncate font-semibold text-foreground">Workspace rail</p>
					<p className="text-xs text-muted-foreground">Activity-preserved state</p>
				</div>
			</div>

			<div className="mt-5 grid gap-2">
				{workspaces.map((workspace) => (
					<button
						key={workspace.id}
						type="button"
						className={cn(
							"rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:outline-none",
							activeId === workspace.id ? "bg-primary/10 text-primary" : "bg-background/70",
						)}
						onClick={() => onSelect(workspace.id)}
					>
						<span className="block text-sm font-semibold">{workspace.label}</span>
						<span className="mt-1 block text-xs text-muted-foreground">
							{workspace.status} / {workspace.owner}
						</span>
					</button>
				))}
			</div>

			<div className="mt-auto pt-4">
				<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
					Rail note
				</p>
				<Textarea
					aria-label="Workspace rail note"
					value={railNote}
					onChange={(event) => setRailNote(event.target.value)}
					className="mt-2 min-h-28 text-sm"
				/>
			</div>
		</div>
	);
}

function WorkspaceCanvas({ workspace }: { workspace: WorkbenchItem }) {
	return (
		<div className="min-h-80 min-w-0 overflow-auto p-5 lg:col-start-3 lg:row-start-1">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{workspace.status}</Badge>
						<Badge variant="outline">{workspace.owner}</Badge>
					</div>
					<h2 className="font-display mt-3 text-4xl leading-none text-foreground">
						{workspace.label}
					</h2>
					<p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
						{workspace.description}
					</p>
				</div>
				<span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<SquareKanban className="size-6" />
				</span>
			</div>

			<div className="mt-6 grid gap-3 md:grid-cols-3">
				{workspace.metrics.map((metric) => (
					<div key={metric.label} className="app-muted-surface p-4">
						<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
							{metric.label}
						</p>
						<p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
							{metric.value}
						</p>
					</div>
				))}
			</div>

			<div className="mt-6 grid gap-4 xl:grid-cols-3">
				{[
					{
						title: "Intake",
						items: ["Validate source", "Assign owner", "Tag SLA"],
					},
					{
						title: "Review",
						items: ["Compare signals", "Resolve blocker", "Commit decision"],
					},
					{
						title: "Publish",
						items: ["Notify team", "Update timeline", "Archive trace"],
					},
				].map((column) => (
					<div key={column.title} className="app-surface p-4">
						<p className="font-semibold text-foreground">{column.title}</p>
						<div className="mt-4 grid gap-3">
							{column.items.map((item) => (
								<div key={item} className="rounded-lg border border-border/60 bg-muted/35 p-3">
									<p className="text-sm font-medium text-foreground">{item}</p>
									<p className="mt-1 text-xs leading-5 text-muted-foreground">
										{workspace.label} / {workspace.owner}
									</p>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function InspectorPanel({ workspace }: { workspace: WorkbenchItem }) {
	const [notes, setNotes] = useState("Preserved inspector draft for the active workspace.");

	return (
		<div className="flex h-full flex-col border-l border-border/60 bg-muted/25 p-4">
			<div className="flex items-center gap-3">
				<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<StickyNote className="size-5" />
				</span>
				<div className="min-w-0">
					<p className="truncate font-semibold text-foreground">Inspector</p>
					<p className="text-xs text-muted-foreground">{workspace.label}</p>
				</div>
			</div>

			<div className="mt-5 grid gap-3">
				<div className="app-surface p-4">
					<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
						Current owner
					</p>
					<p className="mt-2 font-semibold text-foreground">{workspace.owner}</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">{workspace.description}</p>
				</div>
				<div className="app-surface p-4">
					<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
						Inspector notes
					</p>
					<Textarea
						aria-label="Inspector notes"
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						className="mt-2 min-h-36 text-sm"
					/>
				</div>
			</div>

			<div className="mt-auto pt-4">
				<div className="rounded-lg border border-success/20 bg-success/10 p-4">
					<p className="text-sm font-medium text-foreground">Activity proof</p>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">
						Hide and reopen the inspector. This note field remains intact because the boundary is
						hidden instead of fully discarded.
					</p>
				</div>
			</div>
		</div>
	);
}

function ResizeHandle({
	label,
	controls,
	reversed = false,
	value,
	min,
	max,
	onDelta,
	onNudge,
}: {
	label: string;
	controls: string;
	reversed?: boolean;
	value: number;
	min: number;
	max: number;
	onDelta: (delta: number) => void;
	onNudge: (delta: number) => void;
}) {
	const dragRef = useRef<{ pointerId: number; previousX: number } | null>(null);

	const handlePointerDown = (event: ReactPointerEvent<HTMLHRElement>) => {
		if (!event.isPrimary || event.button !== 0 || dragRef.current) return;
		event.preventDefault();
		event.currentTarget.focus({ preventScroll: true });
		event.currentTarget.setPointerCapture(event.pointerId);
		dragRef.current = { pointerId: event.pointerId, previousX: event.clientX };
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLHRElement>) => {
		const drag = dragRef.current;
		if (!drag || drag.pointerId !== event.pointerId) return;
		const delta = event.clientX - drag.previousX;
		drag.previousX = event.clientX;
		onDelta(delta);
	};

	const endDrag = (event: ReactPointerEvent<HTMLHRElement>) => {
		if (dragRef.current?.pointerId !== event.pointerId) return;
		dragRef.current = null;
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLHRElement>) => {
		if (event.key === "ArrowLeft") {
			event.preventDefault();
			onNudge(-24);
		}

		if (event.key === "ArrowRight") {
			event.preventDefault();
			onNudge(24);
		}

		if (event.key === "Home" || event.key === "End") {
			event.preventDefault();
			const target = event.key === "Home" ? min : max;
			onNudge((target - value) * (reversed ? -1 : 1));
		}
	};

	return (
		<hr
			tabIndex={0}
			aria-label={label}
			aria-controls={controls}
			aria-orientation="vertical"
			aria-valuemin={min}
			aria-valuemax={max}
			aria-valuenow={value}
			aria-valuetext={`${value} pixels`}
			className="m-0 h-full w-full cursor-col-resize touch-none border-0 border-x border-border/40 bg-muted/30 transition-colors outline-none select-none hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring/45"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onLostPointerCapture={endDrag}
			onKeyDown={handleKeyDown}
		/>
	);
}

function MetricCard({
	label,
	value,
	detail,
	icon: Icon,
}: {
	label: string;
	value: string;
	detail: string;
	icon: LucideIcon;
}) {
	return (
		<Card className="border-border/60">
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm font-medium text-muted-foreground">{label}</p>
					<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Icon className="size-5" />
					</span>
				</div>
				<p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
				<p className="text-sm leading-6 text-muted-foreground">{detail}</p>
			</CardContent>
		</Card>
	);
}

function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}
