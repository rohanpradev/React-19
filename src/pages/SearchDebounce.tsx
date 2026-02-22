import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
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

type Person = {
	name: string;
	url: string;
};

export function SearchDebounce() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Person[]>([]);
	const [loading, setLoading] = useState(false);

	// Debounced search handler: fetch results from SWAPI using search param
	const handleSearch = useCallback(async (value: string) => {
		if (!value.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const res = await fetch(
				`https://swapi.dev/api/people/?search=${encodeURIComponent(value)}`,
			);
			const data = await res.json();
			setResults(data.results);
		} catch (error) {
			console.error("Search failed", error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	}, []);

	const debouncedSearch = useDebounce(handleSearch, 300);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="inline-flex items-center rounded-md border px-3 py-2 text-sm text-muted-foreground"
			>
				Search Star Wars Characters...
			</button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<Command>
					<CommandInput
						placeholder="Search characters..."
						value={query}
						onValueChange={(value) => {
							setQuery(value);
							debouncedSearch(value);
						}}
					/>

					<CommandList>
						{loading && (
							<div className="flex justify-center py-6">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						)}

						{!loading && results.length === 0 && query && (
							<CommandEmpty>No results found.</CommandEmpty>
						)}

						{!loading && results.length > 0 && (
							<CommandGroup heading="Characters">
								{results.map((person) => (
									<CommandItem key={person.url} onSelect={() => setOpen(false)}>
										{person.name}
									</CommandItem>
								))}
							</CommandGroup>
						)}
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
}
