import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	type PaginationState,
	type SortingState,
	useReactTable,
	type VisibilityState,
} from "@tanstack/react-table";
import {
	ArrowUpDown,
	BadgeDollarSign,
	Building2,
	CircleAlert,
	Filter,
	Layers3,
	type LucideIcon,
	RefreshCw,
	Search,
	UsersRound,
	X,
} from "lucide-react";
import {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { DataTableColumnHeader } from "@/components/data-table-column-header";
import { DataTableViewOptions } from "@/components/data-table-view-options";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	buildCustomersQueryString,
	type CustomerListResponse,
	type CustomerPlan,
	type CustomerRow,
	type CustomerStatus,
	type CustomerTableFilters,
	type CustomerTableSorting,
	createFacetRecord,
	customerPlans,
	customerStatuses,
	defaultCustomerSorting,
	isCustomerFilterId,
	isCustomerSortId,
} from "@/lib/customer-table";
import { Temporal } from "@/lib/temporal";

type CustomerColumnMeta = {
	label?: string;
	headerClassName?: string;
	cellClassName?: string;
};

const columns: ColumnDef<CustomerRow>[] = [
	{
		accessorKey: "name",
		meta: { label: "Customer" } satisfies CustomerColumnMeta,
		enableHiding: false,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Customer" />
		),
		cell: ({ row }) => (
			<div className="space-y-1">
				<div className="text-foreground font-medium">{row.original.name}</div>
				<div className="text-muted-foreground text-xs">
					{row.original.email}
				</div>
			</div>
		),
	},
	{
		accessorKey: "company",
		meta: { label: "Account" } satisfies CustomerColumnMeta,
		enableHiding: false,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Account" />
		),
		cell: ({ row }) => (
			<div className="space-y-1">
				<div className="text-foreground font-medium">
					{row.original.company}
				</div>
				<div className="text-muted-foreground text-xs">
					{row.original.country}
				</div>
			</div>
		),
	},
	{
		accessorKey: "status",
		meta: { label: "Status" } satisfies CustomerColumnMeta,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => (
			<Badge variant={getStatusVariant(row.original.status)}>
				{formatLabel(row.original.status)}
			</Badge>
		),
	},
	{
		accessorKey: "plan",
		meta: { label: "Plan" } satisfies CustomerColumnMeta,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Plan" />
		),
		cell: ({ row }) => (
			<Badge variant="outline">{formatLabel(row.original.plan)}</Badge>
		),
	},
	{
		accessorKey: "annualValue",
		meta: {
			label: "Annual Value",
			headerClassName: "text-right",
			cellClassName: "text-right",
		} satisfies CustomerColumnMeta,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title="Annual Value"
				className="justify-end"
			/>
		),
		cell: ({ row }) => (
			<div className="font-medium tabular-nums">
				{formatCurrency(row.original.annualValue)}
			</div>
		),
	},
	{
		accessorKey: "seats",
		meta: {
			label: "Seats",
			headerClassName: "text-right",
			cellClassName: "text-right",
		} satisfies CustomerColumnMeta,
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title="Seats"
				className="justify-end"
			/>
		),
		cell: ({ row }) => <div className="tabular-nums">{row.original.seats}</div>,
	},
	{
		accessorKey: "lastSeenAt",
		meta: { label: "Last Seen" } satisfies CustomerColumnMeta,
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Last Seen" />
		),
		cell: ({ row }) => (
			<div className="text-muted-foreground text-sm tabular-nums">
				{formatRelativeDate(row.original.lastSeenAt)}
			</div>
		),
	},
];

const emptyFacets = {
	status: createFacetRecord(customerStatuses),
	plan: createFacetRecord(customerPlans),
};

export function ServerTablePage() {
	const hasLoadedRef = useRef(false);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [sorting, setSorting] = useState<SortingState>(defaultCustomerSorting);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
		seats: false,
	});
	const [globalFilter, setGlobalFilter] = useState("");
	const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
	const [refreshKey, setRefreshKey] = useState(0);
	const [response, setResponse] = useState<CustomerListResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedGlobalFilter(globalFilter.trim());
		}, 300);

		return () => clearTimeout(timeout);
	}, [globalFilter]);

	useEffect(() => {
		const controller = new AbortController();
		const isFirstLoad = !hasLoadedRef.current;

		async function loadCustomers() {
			setError(null);
			setIsLoading(isFirstLoad);
			setIsRefreshing(!isFirstLoad);

			try {
				const queryString = buildCustomersQueryString({
					pageIndex: pagination.pageIndex,
					pageSize: pagination.pageSize,
					search: debouncedGlobalFilter,
					sorting: toServerSorting(sorting),
					filters: toServerFilters(columnFilters),
				});
				const requestUrl = `/api/customers?${queryString}&refresh=${refreshKey}`;
				const request = await fetch(requestUrl, {
					signal: controller.signal,
				});

				if (!request.ok) {
					throw new Error(`Request failed with status ${request.status}`);
				}

				const nextResponse = (await request.json()) as CustomerListResponse;
				setResponse(nextResponse);

				setPagination((current) => {
					if (
						current.pageIndex === nextResponse.meta.pageIndex &&
						current.pageSize === nextResponse.meta.pageSize
					) {
						return current;
					}

					return {
						pageIndex: nextResponse.meta.pageIndex,
						pageSize: nextResponse.meta.pageSize,
					};
				});
			} catch (caughtError) {
				if (
					caughtError instanceof DOMException &&
					caughtError.name === "AbortError"
				) {
					return;
				}

				setError(
					caughtError instanceof Error
						? caughtError.message
						: "Unable to load customers.",
				);
			} finally {
				if (!controller.signal.aborted) {
					hasLoadedRef.current = true;
					setIsLoading(false);
					setIsRefreshing(false);
				}
			}
		}

		loadCustomers();

		return () => controller.abort();
	}, [
		columnFilters,
		debouncedGlobalFilter,
		pagination.pageIndex,
		pagination.pageSize,
		refreshKey,
		sorting,
	]);

	const table = useReactTable({
		data: response?.rows ?? [],
		columns,
		getCoreRowModel: getCoreRowModel(),
		manualFiltering: true,
		manualPagination: true,
		manualSorting: true,
		rowCount: response?.meta.totalRows ?? 0,
		state: {
			pagination,
			sorting,
			columnFilters,
			columnVisibility,
			globalFilter,
		},
		onPaginationChange: setPagination,
		onSortingChange: (updater) => {
			setSorting(updater);
			setPagination((current) =>
				current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
			);
		},
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onGlobalFilterChange: setGlobalFilter,
	});

	const totalRows = response?.meta.totalRows ?? 0;
	const pageCount = response?.meta.pageCount ?? 1;
	const visibleColumnCount = table.getVisibleLeafColumns().length;
	const startRow =
		totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1;
	const endRow = Math.min(
		(pagination.pageIndex + 1) * pagination.pageSize,
		totalRows,
	);
	const activeFilters = globalFilter.length > 0 || columnFilters.length > 0;
	const statusFilter =
		(response?.meta.filters.status ??
			readFilterValue(columnFilters, "status")) ||
		"";
	const planFilter =
		(response?.meta.filters.plan ?? readFilterValue(columnFilters, "plan")) ||
		"";
	const statusFacets = response?.facets.status ?? emptyFacets.status;
	const planFacets = response?.facets.plan ?? emptyFacets.plan;
	const skeletonRowIds = Array.from(
		{ length: pagination.pageSize },
		(_, index) => `loading-row-${pagination.pageIndex + 1}-${index + 1}`,
	);

	return (
		<div className="space-y-6">
			<div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px]">
				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">Server-side table</Badge>
						<Badge variant="outline">TanStack Table</Badge>
						<Badge variant="outline">Bun SQL + Drizzle</Badge>
					</div>
					<div className="space-y-3">
						<h1 className="font-display text-4xl leading-none text-foreground sm:text-5xl">
							Revenue Ops Console
						</h1>
						<p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
							A working account queue for renewals, expansion, and risk review.
							Search, filters, sorting, counts, and pagination are resolved by
							the API so the client only renders the slice the team is acting
							on.
						</p>
					</div>
				</div>

				<Card className="border-border/60">
					<CardContent className="space-y-4 pt-6">
						<div className="flex items-center gap-3">
							<span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
								<Layers3 className="size-5" />
							</span>
							<div>
								<p className="text-foreground text-sm font-medium">
									Query orchestration
								</p>
								<p className="text-muted-foreground text-sm">
									The browser holds only view state. The API resolves the data.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Badge variant="outline">
								<Filter className="size-3" />
								Faceted filters
							</Badge>
							<Badge variant="outline">
								<ArrowUpDown className="size-3" />
								Multi-sort
							</Badge>
							<Badge variant="outline">
								<Search className="size-3" />
								Debounced query
							</Badge>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<SummaryCard
					label="Accounts In View"
					value={formatNumber(response?.summary.matchedCustomers ?? 0)}
					description="Accounts matching the current search and filters"
					icon={Building2}
				/>
				<SummaryCard
					label="Annual Value"
					value={formatCurrency(response?.summary.totalAnnualValue ?? 0)}
					description="Combined contract value for the current result set"
					icon={BadgeDollarSign}
				/>
				<SummaryCard
					label="Average Seats"
					value={formatNumber(response?.summary.averageSeats ?? 0)}
					description="Typical seat count across the accounts in view"
					icon={UsersRound}
				/>
			</div>

			<Card className="border-border/60">
				<CardHeader className="gap-4 border-b border-border/60">
					<div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-1">
							<CardTitle>Portfolio View</CardTitle>
							<CardDescription>
								Use this table to isolate trial accounts, spot churn signals,
								and compare plan mix without shipping the full dataset to the
								browser. Hold Shift while sorting to stack sort rules.
							</CardDescription>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<DataTableViewOptions table={table} />

							{activeFilters ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => {
										setGlobalFilter("");
										setColumnFilters([]);
										setPagination((current) =>
											current.pageIndex === 0
												? current
												: { ...current, pageIndex: 0 },
										);
									}}
								>
									<X className="size-4" />
									Reset view
								</Button>
							) : null}

							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => setRefreshKey((value) => value + 1)}
								disabled={isRefreshing}
							>
								<RefreshCw
									className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
								/>
								Refresh
							</Button>
						</div>
					</div>

					<div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_220px_220px_auto]">
						<div className="relative">
							<Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
							<Input
								value={globalFilter}
								onChange={(event) => {
									setGlobalFilter(event.target.value);
									setPagination((current) =>
										current.pageIndex === 0
											? current
											: { ...current, pageIndex: 0 },
									);
								}}
								placeholder="Search contact, email, company, or market"
								className="pl-9"
							/>
						</div>

						<Select
							value={statusFilter || "all"}
							onValueChange={(value) =>
								setNamedFilter(
									"status",
									value === "all" ? "" : value,
									setColumnFilters,
									setPagination,
								)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Any status ({formatNumber(totalRows)})
								</SelectItem>
								{customerStatuses.map((status) => (
									<SelectItem key={status} value={status}>
										{formatLabel(status)} ({formatNumber(statusFacets[status])})
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={planFilter || "all"}
							onValueChange={(value) =>
								setNamedFilter(
									"plan",
									value === "all" ? "" : value,
									setColumnFilters,
									setPagination,
								)
							}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Plan" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">
									Any plan ({formatNumber(totalRows)})
								</SelectItem>
								{customerPlans.map((plan) => (
									<SelectItem key={plan} value={plan}>
										{formatLabel(plan)} ({formatNumber(planFacets[plan])})
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<div className="flex items-center xl:justify-end">
							<Badge variant="outline" className="justify-center px-3 py-2">
								{formatNumber(totalRows)} matching accounts
							</Badge>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4 pt-6">
					{error ? (
						<Alert variant="destructive">
							<CircleAlert />
							<div className="space-y-1">
								<AlertTitle>Unable to load customers</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</div>
						</Alert>
					) : null}

					<div className="app-surface overflow-hidden rounded-[1.5rem]">
						<Table>
							<TableCaption className="px-4 pb-4 text-left">
								Rows {startRow}-{endRow} of {formatNumber(totalRows)} accounts
								in the current view.
							</TableCaption>
							<TableHeader className="bg-muted/30">
								{table.getHeaderGroups().map((headerGroup) => (
									<TableRow key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<TableHead
												key={header.id}
												className={
													getColumnMeta(header.column.columnDef).headerClassName
												}
											>
												{header.isPlaceholder
													? null
													: flexRender(
															header.column.columnDef.header,
															header.getContext(),
														)}
											</TableHead>
										))}
									</TableRow>
								))}
							</TableHeader>
							<TableBody>
								{isLoading ? (
									skeletonRowIds.map((rowId) => (
										<TableRow key={rowId}>
											<TableCell colSpan={visibleColumnCount}>
												<div className="bg-muted h-5 animate-pulse rounded-md" />
											</TableCell>
										</TableRow>
									))
								) : table.getRowModel().rows.length > 0 ? (
									table.getRowModel().rows.map((row) => (
										<TableRow key={row.id}>
											{row.getVisibleCells().map((cell) => (
												<TableCell
													key={cell.id}
													className={
														getColumnMeta(cell.column.columnDef).cellClassName
													}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</TableCell>
											))}
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={visibleColumnCount}
											className="text-muted-foreground h-24 text-center text-sm"
										>
											No accounts match this view.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					<div className="flex flex-col gap-4 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
						<div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
							<Badge variant="outline">
								Page {pagination.pageIndex + 1} of {formatNumber(pageCount)}
							</Badge>
							<Badge variant="outline">
								Order: {formatSortSummary(sorting)}
							</Badge>
							{debouncedGlobalFilter ? (
								<Badge variant="outline">
									Query: "{debouncedGlobalFilter}"
								</Badge>
							) : null}
						</div>

						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							<div className="text-muted-foreground flex items-center gap-2 text-sm">
								<span>Rows per page</span>
								<Select
									value={String(pagination.pageSize)}
									onValueChange={(value) => table.setPageSize(Number(value))}
								>
									<SelectTrigger className="w-27.5">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[10, 20, 30, 50].map((pageSize) => (
											<SelectItem key={pageSize} value={String(pageSize)}>
												{pageSize}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
								>
									Previous
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
								>
									Next
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function getColumnMeta(columnDef: ColumnDef<CustomerRow>) {
	return (columnDef.meta as CustomerColumnMeta | undefined) ?? {};
}

function SummaryCard({
	label,
	value,
	description,
	icon: Icon,
}: {
	label: string;
	value: string;
	description: string;
	icon: LucideIcon;
}) {
	return (
		<Card className="border-border/60">
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-muted-foreground text-sm font-medium">{label}</p>
					<span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
						<Icon className="size-5" />
					</span>
				</div>
				<p className="text-foreground text-3xl font-semibold tracking-tight">
					{value}
				</p>
				<p className="text-muted-foreground text-sm leading-6">{description}</p>
			</CardContent>
		</Card>
	);
}

function getStatusVariant(status: CustomerStatus) {
	switch (status) {
		case "active":
			return "default";
		case "trial":
			return "secondary";
		case "paused":
			return "outline";
		case "churned":
			return "destructive";
	}
}

function setNamedFilter(
	filterId: "status" | "plan",
	value: string,
	setFilters: Dispatch<SetStateAction<ColumnFiltersState>>,
	setPagination: Dispatch<SetStateAction<PaginationState>>,
) {
	setFilters((current) => {
		const remainingFilters = current.filter((filter) => filter.id !== filterId);

		if (!value) {
			return remainingFilters;
		}

		return [...remainingFilters, { id: filterId, value }];
	});
	setPagination((current) =>
		current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
	);
}

function readFilterValue(
	filters: ColumnFiltersState,
	filterId: "status" | "plan",
) {
	const activeFilter = filters.find((filter) => filter.id === filterId);
	return typeof activeFilter?.value === "string" ? activeFilter.value : "";
}

function toServerSorting(sorting: SortingState): CustomerTableSorting {
	return sorting.flatMap((entry) =>
		isCustomerSortId(entry.id) ? [{ id: entry.id, desc: entry.desc }] : [],
	);
}

function toServerFilters(filters: ColumnFiltersState): CustomerTableFilters {
	const normalizedFilters: CustomerTableFilters = [];

	for (const entry of filters) {
		if (
			!isCustomerFilterId(entry.id) ||
			typeof entry.value !== "string" ||
			entry.value.length === 0
		) {
			continue;
		}

		if (
			entry.id === "status" &&
			customerStatuses.includes(entry.value as CustomerStatus)
		) {
			normalizedFilters.push({
				id: "status",
				value: entry.value as CustomerStatus,
			});
		}

		if (
			entry.id === "plan" &&
			customerPlans.includes(entry.value as CustomerPlan)
		) {
			normalizedFilters.push({
				id: "plan",
				value: entry.value as CustomerPlan,
			});
		}
	}

	return normalizedFilters;
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

function formatRelativeDate(timestamp: number) {
	return Temporal.Instant.fromEpochMilliseconds(timestamp)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
}

function formatLabel(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function formatSortSummary(sorting: SortingState) {
	if (sorting.length === 0) {
		return "Last Seen desc";
	}

	return sorting
		.map((entry) => `${formatLabel(entry.id)} ${entry.desc ? "desc" : "asc"}`)
		.join(" / ");
}
