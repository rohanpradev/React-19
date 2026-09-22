import { useDeferredValue, useId, useState, ViewTransition } from "react";
import { NavLink } from "react-router";

import { ArrowUpRight, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { learningStages, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type Stage = keyof typeof learningStages | "all";
const routes = navItems.filter((item) => item.path !== "/overview");

export function RouteExplorer() {
	const searchId = useId();
	const [query, setQuery] = useState("");
	const [stage, setStage] = useState<Stage>("all");
	const deferredQuery = useDeferredValue(query);
	const deferredStage = useDeferredValue(stage);
	const search = deferredQuery.trim().toLowerCase();
	const matches = routes.filter(
		(route) =>
			(deferredStage === "all" || route.stage === deferredStage) &&
			`${route.label} ${route.blurb} ${route.apiLabels.join(" ")}`.toLowerCase().includes(search),
	);

	return (
		<div className="space-y-4">
			<div className="relative">
				<label htmlFor={searchId} className="sr-only">
					Search learning routes
				</label>
				<Search
					aria-hidden="true"
					className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
				/>
				<Input
					id={searchId}
					type="search"
					placeholder="Find a pattern, API, or route…"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					className="bg-card pr-11 pl-9 shadow-xs [&::-webkit-search-cancel-button]:appearance-none"
				/>
				{query && (
					<Button
						type="button"
						variant="ghost"
						size="icon-sm"
						aria-label="Clear route search"
						className="absolute top-1 right-1"
						onClick={() => setQuery("")}
					>
						<X aria-hidden="true" />
					</Button>
				)}
			</div>
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
			<p role="status" className="text-xs text-muted-foreground">
				{matches.length} of {routes.length} routes
			</p>
			<ViewTransition>
				<div
					className={cn(
						"grid gap-3 md:grid-cols-2",
						(query !== deferredQuery || stage !== deferredStage) && "opacity-60",
					)}
					aria-busy={query !== deferredQuery || stage !== deferredStage}
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
						<div className="col-span-full rounded-xl border border-dashed border-border bg-card p-10 text-center">
							<p className="text-sm font-medium">No routes found</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Try “Actions”, “forms”, or another track.
							</p>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="mt-4"
								onClick={() => {
									setQuery("");
									setStage("all");
								}}
							>
								Reset filters
							</Button>
						</div>
					)}
				</div>
			</ViewTransition>
		</div>
	);
}
