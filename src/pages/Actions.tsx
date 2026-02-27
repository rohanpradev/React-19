import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Fake API call
async function updateName(name: string) {
	await new Promise((res) => setTimeout(res, 1000));
	if (name.toLowerCase() === "error") return "Name cannot be 'error'";
	return null;
}

export function ActionsPage() {
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		startTransition(async () => {
			const err = await updateName(name);
			if (err) {
				setError(err);
				return;
			}
			setError(null);
			alert(`Name updated to: ${name}`);
		});
	};

	return (
		<Card className="p-6 space-y-4 max-w-md mx-auto shadow-lg border border-gray-200">
			<h2 className="text-2xl font-bold text-primary">React 19 Actions Demo</h2>

			<input
				type="text"
				value={name}
				onChange={(e) => setName(e.target.value)}
				className="w-full p-2 border rounded"
				placeholder="Enter your name"
			/>

			<button
				onClick={handleSubmit}
				disabled={isPending}
				className="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50"
			>
				{isPending ? "Updating..." : "Update Name"}
			</button>

			{error && <Badge variant="destructive">{error}</Badge>}
		</Card>
	);
}
