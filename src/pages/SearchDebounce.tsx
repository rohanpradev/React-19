import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";

import {
	Building2,
	Clock3,
	Database,
	Loader2,
	SearchIcon,
	Server,
	TimerReset,
	Workflow,
} from "lucide-react";

import { redirectToAuth } from "@/auth/redirects";
import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import type { CustomerAutocompleteItem, CustomerAutocompleteResponse } from "@/lib/customer-table";
import { Temporal } from "@/lib/temporal";

const AUTOCOMPLETE_LIMIT = 8;

function createEmptyResponse(query = ""): CustomerAutocompleteResponse {
	return {
		items: [],
		meta: {
			query,
			limit: AUTOCOMPLETE_LIMIT,
			total: 0,
		},
	};
}

export function SearchDebounce() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [response, setResponse] = useState<CustomerAutocompleteResponse>(createEmptyResponse());
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const deferredQuery = useDeferredValue(query, "");
	const isDeferred = query !== deferredQuery;
	const topResults = response.items.slice(0, 4);
	const resultState = loading
		? "Searching local customer index..."
		: query
			? `${response.meta.total} matching customer${response.meta.total === 1 ? "" : "s"}`
			: "Awaiting search input";

	const runSearch = useEffectEvent(async (value: string, signal: AbortSignal) => {
		const normalizedQuery = value.trim();

		if (!normalizedQuery) {
			setError(null);
			setResponse(createEmptyResponse());
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				query: normalizedQuery,
				limit: String(AUTOCOMPLETE_LIMIT),
			});
			const request = await fetch(`/api/customers/autocomplete?${params}`, {
				signal,
			});

			if (request.status === 401) {
				redirectToAuth();
				return;
			}

			if (!request.ok) {
				throw new Error(`Search failed with status ${request.status}`);
			}

			const nextResponse = (await request.json()) as CustomerAutocompleteResponse;

			if (!signal.aborted) {
				setResponse(nextResponse);
			}
		} catch (caughtError) {
			if (caughtError instanceof DOMException && caughtError.name === "AbortError") {
				return;
			}

			if (!signal.aborted) {
				setError(
					caughtError instanceof Error
						? caughtError.message
						: "Customer autocomplete could not be loaded.",
				);
				setResponse(createEmptyResponse(normalizedQuery));
			}
		} finally {
			if (!signal.aborted) {
				setLoading(false);
			}
		}
	});

	useEffect(() => {
		const controller = new AbortController();
		const timeoutId = window.setTimeout(() => {
			void runSearch(deferredQuery, controller.signal);
		}, 250);

		return () => {
			controller.abort();
			window.clearTimeout(timeoutId);
		};
	}, [deferredQuery]);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19 + Bun API"
				title="Debounced customer autocomplete"
				summary="Search local customer data with deferred input, a short debounce, and a small Bun endpoint."
				points={[
					{
						title: "Responsive typing",
						detail: "Typing stays fast while search work lags behind.",
					},
					{
						title: "Local data",
						detail: "Results come from the same dataset as the table page.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "useDeferredValue",
						href: "https://react.dev/reference/react/useDeferredValue",
					},
					{
						label: "useEffectEvent",
						href: "https://react.dev/reference/react/useEffectEvent",
					},
					{
						label: "Bun fullstack",
						href: "https://bun.sh/docs/bundler/fullstack",
					},
				]}
			/>

			<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
				<Badge variant="outline">Typed: {query || "empty"}</Badge>
				<Badge variant="outline">Deferred: {deferredQuery || "empty"}</Badge>
				<Badge variant="outline">Source: SQLite customers</Badge>
				<Badge variant={isDeferred ? "secondary" : "outline"}>
					{isDeferred ? "Deferred branch catching up" : "Deferred branch synced"}
				</Badge>
			</div>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Autocomplete workspace</CardTitle>
						<CardDescription>Search names, emails, companies, or markets.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="grid gap-3 md:grid-cols-3">
							<div className="app-muted-surface p-4">
								<div className="flex items-start gap-3">
									<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<SearchIcon className="size-5" />
									</span>
									<div>
										<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
											Immediate input
										</p>
										<p className="mt-2 font-medium text-foreground">{query || "empty"}</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Updates on every keystroke so the search field stays responsive.
										</p>
									</div>
								</div>
							</div>

							<div className="app-muted-surface p-4">
								<div className="flex items-start gap-3">
									<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<Clock3 className="size-5" />
									</span>
									<div>
										<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
											Deferred branch
										</p>
										<p className="mt-2 font-medium text-foreground">{deferredQuery || "empty"}</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											Feeds the slower render and fetch path instead of the raw keystroke stream.
										</p>
									</div>
								</div>
							</div>

							<div className="app-muted-surface p-4">
								<div className="flex items-start gap-3">
									<span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<TimerReset className="size-5" />
									</span>
									<div>
										<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
											Debounced API work
										</p>
										<p className="mt-2 font-medium text-foreground">{resultState}</p>
										<p className="mt-1 text-sm leading-6 text-muted-foreground">
											The Bun endpoint is only queried after a short pause.
										</p>
									</div>
								</div>
							</div>
						</div>

						<div className="app-surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p className="text-sm font-medium text-foreground">Open customer autocomplete</p>
							</div>
							<Button type="button" variant="outline" onClick={() => setOpen(true)}>
								<SearchIcon className="size-4" />
								Search customers
							</Button>
						</div>

						<div className="grid gap-3">
							{error ? (
								<Alert variant="destructive">
									<div className="space-y-1">
										<AlertTitle>Autocomplete request failed</AlertTitle>
										<AlertDescription>{error}</AlertDescription>
									</div>
								</Alert>
							) : null}

							<div className="app-surface p-4">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm font-medium text-foreground">Preview results</p>
									</div>
									<Badge variant="outline">{response.meta.total} total matches</Badge>
								</div>

								<div className="mt-4 space-y-3">
									{topResults.length > 0 ? (
										topResults.map((customer) => (
											<CustomerPreviewCard key={customer.id} customer={customer} />
										))
									) : (
										<div className="app-muted-surface p-4 text-sm text-muted-foreground">
											{query
												? "No customer matches yet for the current query."
												: "Type a company, customer name, email, or market to see live results."}
										</div>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Why this is better</CardTitle>
						<CardDescription>Why this pattern works.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="app-muted-surface p-4">
							<div className="flex items-start gap-3">
								<span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Workflow className="size-4" />
								</span>
								<div>
									<p className="font-medium text-foreground">Deferred rendering</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">
										Typing stays responsive.
									</p>
								</div>
							</div>
						</div>

						<div className="app-muted-surface p-4">
							<div className="flex items-start gap-3">
								<span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Server className="size-4" />
								</span>
								<div>
									<p className="font-medium text-foreground">Effect-scoped request orchestration</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">
										Fetch timing stays predictable.
									</p>
								</div>
							</div>
						</div>

						<div className="app-muted-surface p-4">
							<div className="flex items-start gap-3">
								<span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Database className="size-4" />
								</span>
								<div>
									<p className="font-medium text-foreground">Shared customer dataset</p>
									<p className="mt-1 text-sm leading-6 text-muted-foreground">
										Autocomplete and table data stay in sync.
									</p>
								</div>
							</div>
						</div>

						<div className="app-surface p-4">
							<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
								Live status
							</p>
							<p className="mt-2 font-medium text-foreground">{resultState}</p>
							<p className="mt-1 text-sm leading-6 text-muted-foreground">
								Query length: {query.length}. Endpoint limit: {response.meta.limit}. Deferred lag:{" "}
								{isDeferred ? "active" : "settled"}.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>

			<CommandDialog
				open={open}
				onOpenChange={setOpen}
				title="Customer autocomplete"
				description="Search the local SQLite customer dataset through the Bun autocomplete endpoint."
			>
				<CommandInput
					placeholder="Search customer, company, email, or country..."
					value={query}
					onValueChange={setQuery}
				/>

				<CommandList>
					{loading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="size-4 animate-spin text-muted-foreground" />
						</div>
					) : null}

					{error ? (
						<div className="px-3 py-2">
							<Alert variant="destructive">
								<div className="space-y-1">
									<AlertTitle>Search failed</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</div>
							</Alert>
						</div>
					) : null}

					{!loading && !error && !query.trim() ? (
						<CommandEmpty>Type a customer, company, email, or country to begin.</CommandEmpty>
					) : null}

					{!loading && !error && query.trim() && response.items.length === 0 ? (
						<CommandEmpty>No matching customers.</CommandEmpty>
					) : null}

					{response.items.length > 0 ? (
						<CommandGroup heading="Customers">
							{response.items.map((customer) => (
								<CommandItem
									key={customer.id}
									value={`${customer.name} ${customer.email} ${customer.company} ${customer.country} ${customer.plan} ${customer.status}`}
									onSelect={() => {
										setQuery(customer.name);
										setOpen(false);
									}}
									className="flex flex-col items-start gap-2"
								>
									<div className="flex w-full items-start gap-3">
										<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
											<Building2 className="size-5" />
										</div>
										<div className="min-w-0 flex-1 space-y-2">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium text-foreground">{customer.name}</p>
												<Badge variant="outline">{formatLabel(customer.status)}</Badge>
												<Badge variant="secondary">{formatLabel(customer.plan)}</Badge>
											</div>
											<p className="text-sm leading-6 text-muted-foreground">
												{customer.company} / {customer.email}
											</p>
											<p className="text-xs leading-5 text-muted-foreground">
												{customer.country} / last active {formatLastSeen(customer.lastSeenAt)}
											</p>
										</div>
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}
				</CommandList>
			</CommandDialog>
		</div>
	);
}

function CustomerPreviewCard({ customer }: { customer: CustomerAutocompleteItem }) {
	return (
		<div className="app-muted-surface p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<p className="font-medium text-foreground">{customer.name}</p>
					<p className="text-sm leading-6 text-muted-foreground">
						{customer.company} / {customer.email}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Badge variant="outline">{formatLabel(customer.status)}</Badge>
					<Badge variant="secondary">{formatLabel(customer.plan)}</Badge>
				</div>
			</div>
			<p className="mt-3 text-xs leading-5 text-muted-foreground">
				{customer.country} / last active {formatLastSeen(customer.lastSeenAt)}
			</p>
		</div>
	);
}

function formatLabel(value: string) {
	return value
		.replace(/([a-z])([A-Z])/g, "$1 $2")
		.split("-")
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function formatLastSeen(timestamp: number) {
	return Temporal.Instant.fromEpochMilliseconds(timestamp)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
}
