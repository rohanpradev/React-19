import { type CSSProperties, useMemo, useState } from "react";

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	CheckCircle2,
	GripVertical,
	LayoutDashboard,
	MousePointer2,
	Sparkles,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type WorkItem = {
	id: string;
	title: string;
	owner: string;
	area: string;
	effort: number;
	impact: "high" | "medium" | "low";
	confidence: number;
};

const initialWorkItems: WorkItem[] = [
	{
		id: "query-cache",
		title: "Add TanStack Query server-state demo",
		owner: "Data Experience",
		area: "Server state",
		effort: 3,
		impact: "high",
		confidence: 91,
	},
	{
		id: "form-validation",
		title: "Ship schema-backed intake form",
		owner: "Frontend Platform",
		area: "Forms",
		effort: 5,
		impact: "high",
		confidence: 86,
	},
	{
		id: "drizzle-rules",
		title: "Enable Biome Drizzle safety rules",
		owner: "Runtime Platform",
		area: "Tooling",
		effort: 2,
		impact: "medium",
		confidence: 94,
	},
	{
		id: "compiler-audit",
		title: "Mark compiler-hostile component patterns",
		owner: "Design Systems",
		area: "React Compiler",
		effort: 8,
		impact: "medium",
		confidence: 68,
	},
	{
		id: "activity-tabs",
		title: "Convert route previews to Activity boundaries",
		owner: "Product Infrastructure",
		area: "React 19.2",
		effort: 5,
		impact: "low",
		confidence: 73,
	},
];

export function WorkflowBoardPage() {
	const [items, setItems] = useState(initialWorkItems);
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);
	const sortedIds = useMemo(() => items.map((item) => item.id), [items]);
	const totalEffort = items.reduce((total, item) => total + item.effort, 0);
	const topItem = items[0];

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		setItems((currentItems) => {
			const oldIndex = currentItems.findIndex((item) => item.id === active.id);
			const newIndex = currentItems.findIndex((item) => item.id === over.id);

			if (oldIndex < 0 || newIndex < 0) {
				return currentItems;
			}

			return arrayMove(currentItems, oldIndex, newIndex);
		});
	};
	const moveItem = (itemId: string, direction: "up" | "down") => {
		setItems((currentItems) => {
			const currentIndex = currentItems.findIndex((item) => item.id === itemId);

			if (currentIndex < 0) {
				return currentItems;
			}

			const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

			if (nextIndex < 0 || nextIndex >= currentItems.length) {
				return currentItems;
			}

			return arrayMove(currentItems, currentIndex, nextIndex);
		});
	};

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="shadcn + dnd-kit"
				title="Sortable Planning Board"
				summary="A compact drag-and-drop priority stack using dnd-kit sensors, keyboard sorting, and existing shadcn-style surfaces."
				points={[
					{
						title: "Accessible sorting",
						detail:
							"Pointer sensors, keyboard sensors, and visible move controls share one order state.",
					},
					{
						title: "Stable dimensions",
						detail: "Rows keep fixed interaction affordances while the list reorders.",
					},
					{
						title: "Product-shaped example",
						detail: "The board models upgrade sequencing instead of a generic card list.",
					},
				]}
				links={[
					{
						label: "dnd-kit",
						href: "https://dndkit.com/",
					},
					{
						label: "Sortable",
						href: "https://dndkit.com/latest/docs/concepts/sortable",
					},
				]}
			/>

			<div className="grid gap-4 md:grid-cols-3">
				<Card className="border-border/60">
					<CardContent className="space-y-4 pt-6">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-medium text-muted-foreground">Top priority</p>
							<Sparkles className="size-5 text-primary" />
						</div>
						<p className="text-lg font-semibold leading-6 text-foreground">
							{topItem?.title ?? "No work selected"}
						</p>
						<p className="text-sm leading-6 text-muted-foreground">
							Drag a row to make the next engineering decision explicit.
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardContent className="space-y-4 pt-6">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-medium text-muted-foreground">Total effort</p>
							<LayoutDashboard className="size-5 text-primary" />
						</div>
						<p className="text-3xl font-semibold tracking-tight text-foreground">{totalEffort}</p>
						<p className="text-sm leading-6 text-muted-foreground">
							Story-point estimate across the current sequence.
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardContent className="space-y-4 pt-6">
						<div className="flex items-center justify-between gap-3">
							<p className="text-sm font-medium text-muted-foreground">Interaction model</p>
							<MousePointer2 className="size-5 text-primary" />
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline">Pointer sensor</Badge>
							<Badge variant="outline">Keyboard sensor</Badge>
							<Badge variant="outline">Sortable context</Badge>
						</div>
						<p className="text-sm leading-6 text-muted-foreground">
							Use the handle on each row; keyboard focus can reorder through dnd-kit.
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
				<Card className="border-border/60">
					<CardHeader className="border-b border-border/60">
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<CardTitle>Upgrade priority stack</CardTitle>
								<CardDescription>
									Reorder work by impact, confidence, and sequencing risk.
								</CardDescription>
							</div>
							<Button type="button" variant="outline" onClick={() => setItems(initialWorkItems)}>
								<ArrowUpDown className="size-4" />
								Reset order
							</Button>
						</div>
					</CardHeader>
					<CardContent className="pt-6">
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={handleDragEnd}
						>
							<SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
								<div className="grid gap-3">
									{items.map((item, index) => (
										<SortableWorkItem
											key={item.id}
											item={item}
											index={index}
											canMoveUp={index > 0}
											canMoveDown={index < items.length - 1}
											onMoveUp={() => moveItem(item.id, "up")}
											onMoveDown={() => moveItem(item.id, "down")}
										/>
									))}
								</div>
							</SortableContext>
						</DndContext>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Why this library fits</CardTitle>
						<CardDescription>What the example is meant to teach.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{[
							"Drag behavior stays in dnd-kit instead of hand-rolled pointer math.",
							"The sortable primitive keeps keyboard and pointer behavior on one path.",
							"Explicit move buttons preserve an accessible fallback for dense keyboard workflows.",
							"shadcn-style components provide the accessible shell while dnd-kit owns motion.",
							"State remains normal React state, so persistence can later move to Router actions or Query mutations.",
						].map((item) => (
							<div key={item} className="app-muted-surface flex items-start gap-3 p-4">
								<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
								<p className="text-sm leading-6 text-muted-foreground">{item}</p>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function SortableWorkItem({
	item,
	index,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
}: {
	item: WorkItem;
	index: number;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.id,
	});
	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	} satisfies CSSProperties;

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={cn(
				"app-surface grid min-h-30 gap-4 p-4 transition-shadow md:grid-cols-[44px_minmax(0,1fr)_96px_180px]",
				isDragging && "relative z-10 shadow-xl shadow-black/12",
			)}
		>
			<button
				type="button"
				className="flex size-11 items-center justify-center rounded-lg border border-border/70 bg-muted/45 text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/45"
				aria-label={`Reorder ${item.title}`}
				{...attributes}
				{...listeners}
			>
				<GripVertical className="size-5" />
			</button>

			<div className="min-w-0 space-y-3">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary">#{index + 1}</Badge>
					<Badge variant={item.impact === "high" ? "default" : "outline"}>
						{item.impact} impact
					</Badge>
					<Badge variant="outline">{item.area}</Badge>
				</div>
				<div>
					<p className="font-semibold leading-6 text-foreground">{item.title}</p>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">{item.owner}</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 md:grid-cols-1 lg:grid-cols-2">
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					aria-label={`Move ${item.title} up`}
					title="Move up"
					disabled={!canMoveUp}
					onClick={onMoveUp}
				>
					<ArrowUp className="size-4" />
				</Button>
				<Button
					type="button"
					variant="outline"
					size="icon-sm"
					aria-label={`Move ${item.title} down`}
					title="Move down"
					disabled={!canMoveDown}
					onClick={onMoveDown}
				>
					<ArrowDown className="size-4" />
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
				<div className="rounded-lg border border-border/60 bg-muted/35 p-3">
					<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
						Effort
					</p>
					<p className="mt-1 font-semibold text-foreground">{item.effort} pts</p>
				</div>
				<div className="rounded-lg border border-border/60 bg-muted/35 p-3">
					<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
						Confidence
					</p>
					<p className="mt-1 font-semibold text-foreground">{item.confidence}%</p>
				</div>
			</div>
		</div>
	);
}
