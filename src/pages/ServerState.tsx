import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	CheckCircle2,
	DatabaseZap,
	type LucideIcon,
	RefreshCw,
	RotateCcw,
	ShieldAlert,
	Signal,
} from "lucide-react";

import { redirectToAuth } from "@/auth/redirects";
import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type PlatformSignal,
	type PlatformSignalStatus,
	type PlatformSignalsResponse,
	platformSignalStatuses,
	summarizePlatformSignals,
	type UpdatePlatformSignalRequest,
} from "@/lib/platform-signals";
import { Temporal } from "@/lib/temporal";

const platformSignalsQueryKey = ["platform-signals"] as const;
const signalSkeletonIds = [
	"signal-skeleton-1",
	"signal-skeleton-2",
	"signal-skeleton-3",
	"signal-skeleton-4",
];

export function ServerStatePage() {
	const queryClient = useQueryClient();
	const signalsQuery = useQuery({
		queryKey: platformSignalsQueryKey,
		queryFn: fetchPlatformSignals,
		staleTime: 20_000,
	});
	const mutation = useMutation({
		mutationFn: updatePlatformSignal,
		onMutate: async (request) => {
			await queryClient.cancelQueries({ queryKey: platformSignalsQueryKey });
			const previous = queryClient.getQueryData<PlatformSignalsResponse>(platformSignalsQueryKey);

			queryClient.setQueryData<PlatformSignalsResponse>(platformSignalsQueryKey, (current) =>
				current ? applySignalStatus(current, request) : current,
			);

			return { previous };
		},
		onError: (_error, _request, context) => {
			if (context?.previous) {
				queryClient.setQueryData(platformSignalsQueryKey, context.previous);
			}
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: platformSignalsQueryKey });
		},
	});
	const data = signalsQuery.data;

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="TanStack Query + Bun API"
				title="Server-State Cache Lab"
				summary="A protected Bun endpoint feeds TanStack Query so the UI can show stale-while-refresh behavior, optimistic mutation, rollback, and invalidation."
				points={[
					{
						title: "Query keys",
						detail: "The platform signal list is owned by one explicit cache key.",
					},
					{
						title: "Optimistic mutation",
						detail: "Status changes update the cache before the PATCH request completes.",
					},
					{
						title: "Invalidation",
						detail: "The query refetches after mutation so server truth wins.",
					},
				]}
				links={[
					{
						label: "TanStack Query",
						href: "https://tanstack.com/query/latest/docs/framework/react/overview",
					},
					{
						label: "Optimistic updates",
						href: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates",
					},
					{
						label: "Bun routes",
						href: "https://bun.sh/docs/runtime/http/server",
					},
				]}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<Badge variant={signalsQuery.isFetching ? "secondary" : "outline"}>
					{signalsQuery.isFetching ? "Fetching" : "Cache settled"}
				</Badge>
				<Badge variant={mutation.isPending ? "secondary" : "outline"}>
					{mutation.isPending ? "Mutation pending" : "No active mutation"}
				</Badge>
				<Badge variant="outline">staleTime: 20s</Badge>
				<Badge variant="outline">Endpoint: /api/platform/signals</Badge>
			</div>

			{signalsQuery.error ? (
				<Alert variant="destructive">
					<ShieldAlert />
					<div className="space-y-1">
						<AlertTitle>Unable to load server state</AlertTitle>
						<AlertDescription>
							{signalsQuery.error instanceof Error
								? signalsQuery.error.message
								: "The platform signal query failed."}
						</AlertDescription>
					</div>
				</Alert>
			) : null}

			<div className="grid gap-4 md:grid-cols-4">
				<SummaryCard label="Signals" value={data?.summary.total ?? 0} icon={DatabaseZap} />
				<SummaryCard label="Ready" value={data?.summary.ready ?? 0} icon={CheckCircle2} />
				<SummaryCard label="Watch" value={data?.summary.watch ?? 0} icon={Signal} />
				<SummaryCard
					label="Avg confidence"
					value={`${data?.summary.averageConfidence ?? 0}%`}
					icon={RefreshCw}
				/>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
				<Card className="border-border/60">
					<CardHeader className="border-b border-border/60">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<CardTitle>Platform signals</CardTitle>
								<CardDescription>
									Change a signal status to see optimistic cache state and invalidation.
								</CardDescription>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={() => void signalsQuery.refetch()}
								disabled={signalsQuery.isFetching}
							>
								<RefreshCw className={signalsQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
								Refetch
							</Button>
						</div>
					</CardHeader>
					<CardContent className="space-y-3 pt-6">
						{signalsQuery.isLoading ? (
							<div className="grid gap-3">
								{signalSkeletonIds.map((skeletonId) => (
									<div key={skeletonId} className="h-24 animate-pulse rounded-lg bg-muted/65" />
								))}
							</div>
						) : null}

						{data?.signals.map((signal) => (
							<SignalRow
								key={signal.id}
								signal={signal}
								activeMutationId={mutation.variables?.id}
								isMutating={mutation.isPending}
								onStatusChange={(status) =>
									mutation.mutate({
										id: signal.id,
										status,
									})
								}
							/>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<RotateCcw className="size-5" />
						</div>
						<CardTitle>Cache lifecycle</CardTitle>
						<CardDescription>What this route is demonstrating.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{[
							"QueryClientProvider is mounted once around the app.",
							"GET /api/platform/signals fills the shared cache.",
							"PATCH /api/platform/signals runs an optimistic update first.",
							"onSettled invalidates the query so the Bun endpoint reconciles final state.",
							"onError restores the previous cache snapshot.",
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

function SignalRow({
	signal,
	activeMutationId,
	isMutating,
	onStatusChange,
}: {
	signal: PlatformSignal;
	activeMutationId: string | undefined;
	isMutating: boolean;
	onStatusChange: (status: PlatformSignalStatus) => void;
}) {
	const isActiveMutation = isMutating && activeMutationId === signal.id;

	return (
		<div className="app-surface grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_170px_170px] lg:items-center">
			<div className="min-w-0 space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant={getStatusVariant(signal.status)}>{formatLabel(signal.status)}</Badge>
					{isActiveMutation ? <Badge variant="secondary">Optimistic</Badge> : null}
				</div>
				<div>
					<p className="font-semibold leading-6 text-foreground">{signal.title}</p>
					<p className="mt-1 text-sm leading-6 text-muted-foreground">{signal.detail}</p>
				</div>
				<p className="text-xs leading-5 text-muted-foreground">
					{signal.owner} / updated {formatTimestamp(signal.updatedAt)}
				</p>
			</div>

			<div className="rounded-lg border border-border/60 bg-muted/35 p-3">
				<p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
					Confidence
				</p>
				<p className="mt-1 text-lg font-semibold text-foreground">{signal.confidence}%</p>
			</div>

			<Select
				value={signal.status}
				onValueChange={(status) => onStatusChange(status as PlatformSignalStatus)}
				disabled={isMutating}
			>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{platformSignalStatuses.map((status) => (
						<SelectItem key={status} value={status}>
							{formatLabel(status)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function SummaryCard({
	label,
	value,
	icon: Icon,
}: {
	label: string;
	value: number | string;
	icon: LucideIcon;
}) {
	return (
		<Card className="border-border/60">
			<CardContent className="space-y-4 pt-6">
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm font-medium text-muted-foreground">{label}</p>
					<Icon className="size-5 text-primary" />
				</div>
				<p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
			</CardContent>
		</Card>
	);
}

async function fetchPlatformSignals(): Promise<PlatformSignalsResponse> {
	const response = await fetch("/api/platform/signals");

	if (response.status === 401) {
		redirectToAuth();
		throw new Error("Authentication is required.");
	}

	if (!response.ok) {
		throw new Error(`Platform signals failed with status ${response.status}`);
	}

	return (await response.json()) as PlatformSignalsResponse;
}

async function updatePlatformSignal(
	request: UpdatePlatformSignalRequest,
): Promise<PlatformSignalsResponse> {
	const response = await fetch("/api/platform/signals", {
		method: "PATCH",
		headers: {
			"content-type": "application/json",
		},
		body: JSON.stringify(request),
	});

	if (response.status === 401) {
		redirectToAuth();
		throw new Error("Authentication is required.");
	}

	if (!response.ok) {
		throw new Error(`Platform signal update failed with status ${response.status}`);
	}

	return (await response.json()) as PlatformSignalsResponse;
}

function applySignalStatus(
	response: PlatformSignalsResponse,
	request: UpdatePlatformSignalRequest,
): PlatformSignalsResponse {
	const signals = response.signals.map((signal) =>
		signal.id === request.id
			? {
					...signal,
					status: request.status,
					updatedAt: Date.now(),
				}
			: signal,
	);

	return {
		signals,
		summary: summarizePlatformSignals(signals),
	};
}

function getStatusVariant(status: PlatformSignalStatus) {
	switch (status) {
		case "ready":
			return "default";
		case "watch":
			return "secondary";
		case "risk":
			return "destructive";
	}
}

function formatLabel(value: string) {
	return value
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function formatTimestamp(timestamp: number) {
	return Temporal.Instant.fromEpochMilliseconds(timestamp)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
}
