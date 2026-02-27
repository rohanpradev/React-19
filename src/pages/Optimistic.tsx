import { useOptimistic, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";

// Fake API
async function updateName(name: string) {
	await new Promise((res) => setTimeout(res, 1000));
	return name;
}

export function UseOptimisticPage() {
	const [currentName, setCurrentName] = useState("John");
	const [optimisticName, setOptimisticName] = useOptimistic(currentName);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Wrap optimistic update + async request in a transition
		startTransition(async () => {
			setOptimisticName((prev) => prev); // triggers optimistic render

			const updated = await updateName(optimisticName);
			setCurrentName(updated);
		});
	};

	return (
		<Card className="p-6 space-y-4 max-w-md mx-auto shadow-lg border border-gray-200">
			<h2 className="text-2xl font-bold text-primary">useOptimistic Demo</h2>

			<p>
				Current name: <strong>{optimisticName}</strong>
			</p>

			<form onSubmit={handleSubmit} className="space-y-2">
				<input
					type="text"
					value={optimisticName}
					onChange={(e) => setOptimisticName(e.target.value)}
					className="w-full p-2 border rounded"
				/>
				<button
					type="submit"
					className="px-4 py-2 rounded bg-blue-500 text-white"
					disabled={isPending}
				>
					{isPending ? "Updating..." : "Submit"}
				</button>
			</form>
		</Card>
	);
}
