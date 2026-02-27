import { Suspense, use } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

async function fetchCharacter(id: number) {
	const res = await fetch(`https://swapi.dev/api/people/${id}/`);
	if (!res.ok) throw new Error("Failed to fetch character");
	return res.json() as Promise<{
		name: string;
		height: string;
		mass: string;
		species: string[];
		homeworld: string;
	}>;
}

const characterPromise = fetchCharacter(1);

function CharacterCard() {
	const character = use(characterPromise);

	return (
		<div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-6 rounded-xl shadow-2xl text-white max-w-md mx-auto transform transition-transform hover:-translate-y-2 hover:scale-105">
			<h2 className="text-3xl font-extrabold mb-4 drop-shadow-md">
				{character.name}
			</h2>

			<div className="space-y-2 text-sm md:text-base">
				<p>
					<span className="font-semibold">Height:</span>{" "}
					<Badge variant="secondary">{character.height} cm</Badge>
				</p>
				<p>
					<span className="font-semibold">Mass:</span>{" "}
					<Badge variant="secondary">{character.mass} kg</Badge>
				</p>
				<p>
					<span className="font-semibold">Homeworld:</span>{" "}
					<Badge variant="default">{character.homeworld}</Badge>
				</p>
				<p>
					<span className="font-semibold">Species:</span>{" "}
					{character.species.length > 0 ? (
						character.species.map((s) => (
							<Badge key={s} variant="default" className="mr-2">
								{s}
							</Badge>
						))
					) : (
						<Badge variant="default">Human</Badge>
					)}
				</p>
			</div>
		</div>
	);
}

export function ReactUsePage() {
	return (
		<Suspense
			fallback={
				<div className="p-6 max-w-md mx-auto animate-pulse bg-gray-200 rounded-xl">
					Loading Star Wars character...
				</div>
			}
		>
			<ScrollArea className="max-h-[500px] p-4">
				<CharacterCard />
			</ScrollArea>
		</Suspense>
	);
}
