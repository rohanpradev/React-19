import {
	Activity,
	type CSSProperties,
	useCallback,
	useDeferredValue,
	useMemo,
	useState,
	useTransition,
} from "react";

import {
	Building2,
	CheckCircle2,
	DatabaseZap,
	Filter,
	Gauge,
	type LucideIcon,
	Search,
	ShieldCheck,
} from "lucide-react";

import { FeatureIntro } from "@/components/feature-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EntityTier = "strategic" | "commercial" | "digital" | "self-serve";
type EntityHealth = "healthy" | "watch" | "risk";

type Entity = {
	id: string;
	name: string;
	company: string;
	owner: string;
	region: string;
	tier: EntityTier;
	health: EntityHealth;
	annualValue: number;
	seats: number;
	usageScore: number;
	openRisks: number;
};

type VirtualRow = {
	index: number;
	key: string;
	start: number;
	size: number;
};

const rowHeight = 88;
const virtualOverscan = 8;
const entityTiers = ["strategic", "commercial", "digital", "self-serve"] as const;
const entityHealthValues = ["healthy", "watch", "risk"] as const;
const regions = ["North America", "Europe", "India", "Australia", "Japan", "Brazil"] as const;
const owners = [
	"Platform Success",
	"Enterprise Growth",
	"Solutions Desk",
	"Lifecycle Team",
	"Technical Success",
] as const;

const entities = createEntities(5000);

export function VirtualExplorerPage() {
	const [searchInput, setSearchInput] = useState("");
	const [search, setSearch] = useState("");
	const [tier, setTier] = useState<EntityTier | "all">("all");
	const [health, setHealth] = useState<EntityHealth | "all">("all");
	const [selectedId, setSelectedId] = useState(entities[0]?.id ?? "");
	const [isPending, startTransition] = useTransition();
	const deferredSearch = useDeferredValue(search, "");
	const isDeferred = searchInput !== deferredSearch;

	const filteredEntities = useMemo(() => {
		const normalizedSearch = deferredSearch.trim().toLowerCase();

		return entities.filter((entity) => {
			const matchesTier = tier === "all" || entity.tier === tier;
			const matchesHealth = health === "all" || entity.health === health;
			const matchesSearch =
				!normalizedSearch ||
				`${entity.name} ${entity.company} ${entity.owner} ${entity.region}`
					.toLowerCase()
					.includes(normalizedSearch);

			return matchesTier && matchesHealth && matchesSearch;
		});
	}, [deferredSearch, health, tier]);

	const selectedEntity =
		filteredEntities.find((entity) => entity.id === selectedId) ?? filteredEntities[0] ?? null;
	const summary = useMemo(() => summarizeEntities(filteredEntities), [filteredEntities]);
	const virtualizer = useVirtualRows(filteredEntities.length, rowHeight, virtualOverscan);
	const isBusy = isPending || isDeferred;
	const renderedRangeLabel =
		filteredEntities.length === 0
			? "Rows 0-0 rendered"
			: `Rows ${virtualizer.range.start + 1}-${virtualizer.range.end} rendered`;

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Enterprise UI pattern"
				title="Virtualized Entity Explorer"
				summary="A high-volume account browser that teaches deferred filtering, fixed-row virtualization, ref cleanup, and preserved detail state without shipping another paginated table."
				points={[
					{
						title: "Virtual window",
						detail: "Only visible rows plus overscan are rendered from a 5,000-account dataset.",
					},
					{
						title: "React 19 scheduling",
						detail:
							"Filter updates use transitions and deferred input so typing remains responsive.",
					},
					{
						title: "Ref cleanup",
						detail:
							"The scroller uses a callback ref cleanup to detach ResizeObserver and scroll listeners.",
					},
				]}
				links={[
					{
						label: "useDeferredValue",
						href: "https://react.dev/reference/react/useDeferredValue",
					},
					{
						label: "useTransition",
						href: "https://react.dev/reference/react/useTransition",
					},
					{
						label: "Activity",
						href: "https://react.dev/reference/react/Activity",
					},
					{
						label: "TanStack Virtual",
						href: "https://tanstack.com/virtual/latest/docs/framework/react/react-virtual",
					},
				]}
			/>

			<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Accounts in view"
					value={formatNumber(filteredEntities.length)}
					detail={`${formatNumber(entities.length)} total modeled records`}
					icon={DatabaseZap}
				/>
				<MetricCard
					label="Annual value"
					value={formatCurrency(summary.annualValue)}
					detail="Filtered account value"
					icon={Building2}
				/>
				<MetricCard
					label="Average usage"
					value={`${summary.averageUsage}%`}
					detail="Weighted by visible rows"
					icon={Gauge}
				/>
				<MetricCard
					label="Risk accounts"
					value={formatNumber(summary.riskAccounts)}
					detail="Watch or risk health"
					icon={ShieldCheck}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
				<Card className="border-border/60">
					<CardHeader className="gap-4 border-b border-border/60">
						<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<CardTitle>Account intelligence list</CardTitle>
								<CardDescription>
									Search, filter, and inspect a large record set while keeping DOM work bounded.
								</CardDescription>
							</div>
							<div className="flex flex-wrap gap-2">
								<Badge variant={isBusy ? "secondary" : "outline"}>
									{isBusy ? "Scheduling filter work" : "Filter branch settled"}
								</Badge>
								<Badge variant="outline">{renderedRangeLabel}</Badge>
							</div>
						</div>

						<div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto]">
							<div className="relative">
								<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={searchInput}
									onChange={(event) => {
										const nextSearch = event.target.value;
										setSearchInput(nextSearch);
										startTransition(() => setSearch(nextSearch));
									}}
									placeholder="Search account, owner, company, or region"
									className="pl-9"
								/>
							</div>

							<SegmentedFilter
								label="Tier"
								value={tier}
								options={entityTiers}
								onChange={(value) => startTransition(() => setTier(value as EntityTier | "all"))}
							/>
							<SegmentedFilter
								label="Health"
								value={health}
								options={entityHealthValues}
								onChange={(value) =>
									startTransition(() => setHealth(value as EntityHealth | "all"))
								}
							/>
						</div>
					</CardHeader>

					<CardContent className="pt-6">
						<div className="overflow-hidden rounded-lg border border-border/70 bg-card/80">
							<div className="grid h-11 grid-cols-[minmax(0,1.2fr)_120px_120px_120px] items-center border-b border-border/60 bg-muted/35 px-4 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
								<span>Account</span>
								<span className="hidden sm:block">Health</span>
								<span className="hidden md:block">Usage</span>
								<span className="hidden lg:block">Value</span>
							</div>

							<div ref={virtualizer.scrollRef} className="h-[520px] overflow-auto">
								{filteredEntities.length === 0 ? (
									<div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
										No accounts match the current filters.
									</div>
								) : (
									<div
										className="relative"
										style={{ height: virtualizer.totalHeight }}
										role="listbox"
										aria-label="Filtered accounts"
									>
										{virtualizer.rows.map((virtualRow) => {
											const entity = filteredEntities[virtualRow.index];

											if (!entity) {
												return null;
											}

											return (
												<EntityRow
													key={virtualRow.key}
													entity={entity}
													selected={selectedEntity?.id === entity.id}
													style={{
														height: virtualRow.size,
														transform: `translateY(${virtualRow.start}px)`,
													}}
													onSelect={() => setSelectedId(entity.id)}
												/>
											);
										})}
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Preserved detail panel</Badge>
							<Badge variant="outline">React Activity</Badge>
						</div>
						<CardTitle>Account detail</CardTitle>
						<CardDescription>
							The detail surface stays mounted when an account is available, preserving its local
							notes.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Activity mode={selectedEntity ? "visible" : "hidden"}>
							{selectedEntity ? <EntityDetail entity={selectedEntity} /> : null}
						</Activity>

						{selectedEntity ? null : (
							<div className="app-muted-surface p-4 text-sm text-muted-foreground">
								Select an account from the virtualized list.
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function useVirtualRows(count: number, size: number, overscan: number) {
	const [viewportHeight, setViewportHeight] = useState(0);
	const [scrollTop, setScrollTop] = useState(0);

	const scrollRef = useCallback((node: HTMLDivElement | null) => {
		if (!node) {
			return;
		}

		const syncMeasurements = () => {
			setViewportHeight(node.clientHeight);
			setScrollTop(node.scrollTop);
		};
		const observer = new ResizeObserver(syncMeasurements);

		syncMeasurements();
		observer.observe(node);
		node.addEventListener("scroll", syncMeasurements, { passive: true });

		return () => {
			observer.disconnect();
			node.removeEventListener("scroll", syncMeasurements);
		};
	}, []);

	return useMemo(() => {
		const totalHeight = count * size;
		const visibleCount = Math.ceil(viewportHeight / size);
		const startIndex = Math.max(0, Math.floor(scrollTop / size) - overscan);
		const endIndex = Math.min(count, startIndex + visibleCount + overscan * 2);
		const rows: VirtualRow[] = [];

		for (let index = startIndex; index < endIndex; index += 1) {
			rows.push({
				index,
				key: `virtual-row-${index}`,
				start: index * size,
				size,
			});
		}

		return {
			scrollRef,
			rows,
			totalHeight,
			range: {
				start: count === 0 ? 0 : startIndex,
				end: endIndex,
			},
		};
	}, [count, overscan, scrollRef, scrollTop, size, viewportHeight]);
}

function EntityRow({
	entity,
	selected,
	style,
	onSelect,
}: {
	entity: Entity;
	selected: boolean;
	style: CSSProperties;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			role="option"
			aria-selected={selected}
			className={cn(
				"absolute inset-x-0 grid w-full grid-cols-[minmax(0,1.2fr)_120px_120px_120px] items-center border-b border-border/50 px-4 text-left transition-colors hover:bg-muted/45 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:outline-none",
				selected && "bg-primary/8",
			)}
			style={style}
			onClick={onSelect}
		>
			<span className="min-w-0">
				<span className="block truncate text-sm font-semibold text-foreground">{entity.name}</span>
				<span className="mt-1 block truncate text-xs text-muted-foreground">
					{entity.company} / {entity.owner} / {entity.region}
				</span>
			</span>
			<span className="hidden sm:block">
				<HealthBadge health={entity.health} />
			</span>
			<span className="hidden text-sm font-medium text-foreground tabular-nums md:block">
				{entity.usageScore}%
			</span>
			<span className="hidden text-sm font-medium text-foreground tabular-nums lg:block">
				{formatCurrency(entity.annualValue)}
			</span>
		</button>
	);
}

function EntityDetail({ entity }: { entity: Entity }) {
	const [notes, setNotes] = useState(
		"Ask about rollout blockers before the next renewal checkpoint.",
	);

	return (
		<div className="space-y-4">
			<div className="app-muted-surface p-4">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="font-semibold text-foreground">{entity.name}</p>
						<p className="mt-1 text-sm leading-6 text-muted-foreground">
							{entity.company} / {entity.region}
						</p>
					</div>
					<HealthBadge health={entity.health} />
				</div>
				<div className="mt-4 grid grid-cols-2 gap-2">
					<DetailStat label="Tier" value={formatLabel(entity.tier)} />
					<DetailStat label="Seats" value={formatNumber(entity.seats)} />
					<DetailStat label="Usage" value={`${entity.usageScore}%`} />
					<DetailStat label="Risks" value={formatNumber(entity.openRisks)} />
				</div>
			</div>

			<div className="app-surface p-4">
				<p className="text-sm font-semibold text-foreground">Local inspection notes</p>
				<textarea
					aria-label="Account inspection notes"
					value={notes}
					onChange={(event) => setNotes(event.target.value)}
					className="mt-3 min-h-28 w-full resize-none rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm leading-6 text-foreground transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring/45"
				/>
				<p className="mt-2 text-xs leading-5 text-muted-foreground">
					Change selection and come back; this local state is intentionally preserved while the
					panel remains active.
				</p>
			</div>

			<div className="grid gap-3">
				{[
					"Virtualization reduces DOM pressure without changing the product workflow.",
					"Deferred filtering keeps raw input responsive while the large list catches up.",
					"Activity is useful when the detail surface is expensive or stateful.",
				].map((item) => (
					<div key={item} className="flex items-start gap-3 rounded-lg bg-muted/35 p-3">
						<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
						<p className="text-sm leading-6 text-muted-foreground">{item}</p>
					</div>
				))}
			</div>
		</div>
	);
}

function SegmentedFilter({
	label,
	value,
	options,
	onChange,
}: {
	label: string;
	value: string;
	options: readonly string[];
	onChange: (value: string) => void;
}) {
	return (
		<div className="flex min-w-0 flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-background/80 p-1">
			<span className="flex items-center gap-1 px-2 text-xs font-medium text-muted-foreground">
				<Filter className="size-3" />
				{label}
			</span>
			{["all", ...options].map((option) => (
				<Button
					key={option}
					type="button"
					size="sm"
					variant={value === option ? "default" : "ghost"}
					className="h-7 px-2 text-xs"
					onClick={() => onChange(option)}
				>
					{formatLabel(option)}
				</Button>
			))}
		</div>
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

function DetailStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg border border-border/60 bg-background/70 p-3">
			<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
				{label}
			</p>
			<p className="mt-1 font-semibold text-foreground">{value}</p>
		</div>
	);
}

function HealthBadge({ health }: { health: EntityHealth }) {
	const className =
		health === "healthy"
			? "border-success/20 bg-success/10 text-success"
			: health === "watch"
				? "border-warning/25 bg-warning/12 text-warning-foreground"
				: "border-destructive/20 bg-destructive/10 text-destructive";

	return (
		<Badge variant="outline" className={className}>
			{formatLabel(health)}
		</Badge>
	);
}

function summarizeEntities(items: Entity[]) {
	if (items.length === 0) {
		return {
			annualValue: 0,
			averageUsage: 0,
			riskAccounts: 0,
		};
	}

	const annualValue = items.reduce((total, item) => total + item.annualValue, 0);
	const usageTotal = items.reduce((total, item) => total + item.usageScore, 0);
	const riskAccounts = items.filter((item) => item.health !== "healthy").length;

	return {
		annualValue,
		averageUsage: Math.round(usageTotal / items.length),
		riskAccounts,
	};
}

function createEntities(count: number): Entity[] {
	return Array.from({ length: count }, (_, index) => {
		const tier = entityTiers[index % entityTiers.length] ?? "commercial";
		const health =
			index % 11 === 0 ? "risk" : index % 5 === 0 ? "watch" : ("healthy" satisfies EntityHealth);
		const region = regions[index % regions.length] ?? "North America";
		const owner = owners[index % owners.length] ?? "Platform Success";
		const seats = 18 + ((index * 37) % 980);
		const annualValue = seats * (tier === "strategic" ? 920 : tier === "commercial" ? 530 : 220);

		return {
			id: `entity-${index + 1}`,
			name: `Account ${String(index + 1).padStart(4, "0")}`,
			company: `${["Northstar", "Atlas", "Summit", "Vertex", "Cobalt", "Harbor"][index % 6]} Systems`,
			owner,
			region,
			tier,
			health,
			annualValue,
			seats,
			usageScore: 42 + ((index * 13) % 57),
			openRisks: health === "risk" ? 3 + (index % 4) : health === "watch" ? 1 + (index % 2) : 0,
		};
	});
}

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatNumber(value: number) {
	return new Intl.NumberFormat("en-US", {
		maximumFractionDigits: 0,
	}).format(value);
}

function formatLabel(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}
