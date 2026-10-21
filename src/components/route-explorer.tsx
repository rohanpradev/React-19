import { useDeferredValue, useId, useRef, useState, ViewTransition } from "react";
import { NavLink } from "react-router";

import { ArrowUpRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { learningStages, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Stage = keyof typeof learningStages | "all";
const routes = navItems.filter((item) => item.path !== "/overview");

export function RouteExplorer() {
	const searchId = useId();
	const resultsId = useId();
	const statusId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState("");
	const [stage, setStage] = useState<Stage>("all");
	const deferredQuery = useDeferredValue(query);
	const deferredStage = useDeferredValue(stage);
	const isStale = query !== deferredQuery || stage !== deferredStage;
	const search = deferredQuery.trim().toLowerCase();
	const matches = routes.filter(
		(route) =>
			(deferredStage === "all" || route.stage === deferredStage) &&
			`${route.label} ${route.blurb} ${route.apiLabels.join(" ")}`.toLowerCase().includes(search),
	);

	return (
		<div className="space-y-4">
			<InputGroup className="h-11 bg-card">
				<label htmlFor={searchId} className="sr-only">
					Search learning routes
				</label>
				<InputGroupAddon>
					<Search aria-hidden="true" />
				</InputGroupAddon>
				<InputGroupInput
					id={searchId}
					ref={searchRef}
					type="search"
					aria-controls={resultsId}
					aria-describedby={statusId}
					placeholder="Find a pattern, API, or route…"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					className="h-full [&::-webkit-search-cancel-button]:appearance-none"
				/>
				{query && (
					<InputGroupAddon align="inline-end">
						<InputGroupButton
							type="button"
							variant="ghost"
							size="icon-sm"
							aria-label="Clear route search"
							onClick={() => {
								setQuery("");
								searchRef.current?.focus();
							}}
						>
							<X aria-hidden="true" />
						</InputGroupButton>
					</InputGroupAddon>
				)}
			</InputGroup>
			<fieldset className="flex flex-wrap gap-2">
				<legend className="sr-only">Filter by learning track</legend>
				<Button
					type="button"
					size="sm"
					variant={stage === "all" ? "default" : "ghost"}
					aria-pressed={stage === "all"}
					onClick={() => setStage("all")}
				>
					All tracks
				</Button>
				{Object.entries(learningStages)
					.filter(([key]) => routes.some((route) => route.stage === key))
					.map(([key, label]) => (
						<Button
							key={key}
							type="button"
							size="sm"
							variant={stage === key ? "default" : "ghost"}
							aria-pressed={stage === key}
							onClick={() => setStage(key as Stage)}
						>
							{label}
						</Button>
					))}
			</fieldset>
			<p id={statusId} role="status" aria-busy={isStale} className="text-xs text-muted-foreground">
				{matches.length} of {routes.length} routes
			</p>
			<ViewTransition>
				<div
					id={resultsId}
					className={cn("grid gap-3 md:grid-cols-2", isStale && "opacity-60")}
					aria-busy={isStale}
				>
					{matches.map((route) => {
						const Icon = route.icon;
						return (
							<NavLink
								key={route.path}
								to={route.path}
								className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm"
							>
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40 text-muted-foreground transition-colors group-hover:border-primary/20 group-hover:bg-primary/10 group-hover:text-primary">
									<Icon aria-hidden="true" className="size-4" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-semibold">{route.label}</span>
									<span className="mt-1 block text-xs leading-5 text-muted-foreground">
										{route.blurb}
									</span>
								</span>
								<ArrowUpRight
									aria-hidden="true"
									className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-primary"
								/>
							</NavLink>
						);
					})}
					{matches.length === 0 && (
						<Empty className="col-span-full border bg-card">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Search aria-hidden="true" />
								</EmptyMedia>
								<EmptyTitle>No routes found</EmptyTitle>
								<EmptyDescription>Try “Actions”, “forms”, or another track.</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="mt-4"
									onClick={() => {
										setQuery("");
										setStage("all");
										searchRef.current?.focus();
									}}
								>
									Reset filters
								</Button>
							</EmptyContent>
						</Empty>
					)}
				</div>
			</ViewTransition>
		</div>
	);
}
