import { Loader2, SearchIcon } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { FeatureIntro } from "@/components/feature-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/useDebounce";

type FeatureSearchResult = {
	name: string;
	category: string;
	description: string;
};

const featureCatalog: FeatureSearchResult[] = [
	{
		name: "useActionState",
		category: "Forms",
		description:
			"Returns state from a form action and replaces it with the next action result.",
	},
	{
		name: "useFormStatus",
		category: "Forms",
		description:
			"Lets nested UI read the pending state and submitted data of a parent form.",
	},
	{
		name: "useOptimistic",
		category: "Mutation UX",
		description:
			"Layers optimistic UI over committed state while the real request is running.",
	},
	{
		name: "use",
		category: "Render-time data",
		description:
			"Reads Promises and context during render and works with Suspense.",
	},
	{
		name: "ref as a prop",
		category: "DOM integration",
		description:
			"Lets components receive refs as normal props without special forwarding wrappers.",
	},
	{
		name: "Document metadata",
		category: "DOM integration",
		description:
			"Supports rendering title, meta, and link tags directly from components.",
	},
	{
		name: "Stylesheet support",
		category: "DOM integration",
		description: "Improves control over stylesheets and their precedence.",
	},
	{
		name: "Custom Elements",
		category: "Interop",
		description: "Makes React friendlier when rendering Web Components.",
	},
];

export function SearchDebounce() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<FeatureSearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const deferredQuery = useDeferredValue(query, "");

	const handleSearch = useCallback(async (value: string) => {
		if (!value.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		await new Promise((resolve) => setTimeout(resolve, 250));

		const nextResults = featureCatalog.filter((feature) => {
			const haystack =
				`${feature.name} ${feature.category} ${feature.description}`.toLowerCase();
			return haystack.includes(value.trim().toLowerCase());
		});

		setResults(nextResults);
		setLoading(false);
	}, []);

	const debouncedSearch = useDebounce(handleSearch, 250);
	const isDeferred = query !== deferredQuery;

	useEffect(() => {
		debouncedSearch(deferredQuery);
	}, [debouncedSearch, deferredQuery]);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19 + UX pattern"
				title="Debounced search with deferred input"
				summary="React 19 still expects you to shape search traffic yourself, but useDeferredValue now accepts an initial value so the UI can separate immediate typing from slower result work more cleanly. This page pairs that with a classic debounce."
				points={[
					{
						title: "Avoid request spam",
						detail:
							"Debouncing waits for the user to pause before the search work runs, which is especially useful when input is tied to remote results.",
					},
					{
						title: "Keep the input responsive",
						detail:
							"The field updates immediately while the slower search branch follows the deferred value instead of the raw keystroke stream.",
					},
					{
						title: "React 19 adds an initial value",
						detail:
							"useDeferredValue(query, '') lets the first render stay intentionally empty, then schedules the deferred branch afterward.",
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
				]}
			/>

			<div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
				<Badge variant="outline">Typed: {query || "empty"}</Badge>
				<Badge variant="outline">Deferred: {deferredQuery || "empty"}</Badge>
				<Badge variant={isDeferred ? "secondary" : "outline"}>
					{isDeferred
						? "Deferred branch catching up"
						: "Deferred branch synced"}
				</Badge>
			</div>

			<Button type="button" variant="outline" onClick={() => setOpen(true)}>
				<SearchIcon className="size-4" />
				Search the React 19 feature index
			</Button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput
						placeholder="Search hooks and release features..."
						value={query}
						onValueChange={setQuery}
					/>

					<CommandList>
						{loading && (
							<div className="flex justify-center py-6">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						)}

						{!loading && results.length === 0 && query && (
							<CommandEmpty>No matching feature notes.</CommandEmpty>
						)}

						{!loading && results.length > 0 && (
							<CommandGroup heading="React 19">
								{results.map((feature) => (
									<CommandItem
										key={feature.name}
										onSelect={() => setOpen(false)}
										className="flex flex-col items-start gap-1 py-3"
									>
										<div className="font-medium">{feature.name}</div>
										<div className="text-xs text-muted-foreground">
											{feature.category}
										</div>
										<div className="text-sm text-muted-foreground">
											{feature.description}
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</CommandDialog>
		</div>
	);
}
