import { useState, useTransition } from "react";
import { FeatureIntro } from "@/components/feature-intro";
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
import { Label } from "@/components/ui/label";
import { Temporal } from "@/lib/temporal";

async function reassignAccounts(owner: string) {
	await new Promise((resolve) => setTimeout(resolve, 850));

	if (owner.trim().length < 3) {
		throw new Error("Use a real owner name so the batch action can complete.");
	}

	return {
		owner,
		updatedCount: 24,
		completedAt: Temporal.Now.zonedDateTimeISO().toLocaleString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		}),
	};
}

export function ActionsPage() {
	const [owner, setOwner] = useState("Ari Stone");
	const [notice, setNotice] = useState(
		"24 expansion accounts are currently selected.",
	);
	const [error, setError] = useState<string | null>(null);
	const [lastRun, setLastRun] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		startTransition(async () => {
			setError(null);

			try {
				const result = await reassignAccounts(owner);
				setNotice(
					`${result.updatedCount} accounts were moved to ${result.owner}.`,
				);
				setLastRun(result.completedAt);
			} catch (caughtError) {
				setError(
					caughtError instanceof Error
						? caughtError.message
						: "The action could not be completed.",
				);
			}
		});
	};

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Async Actions with startTransition"
				summary="React 19 formalizes async transitions as Actions. They are a good fit for mutations that are not primarily form-driven but still need pending UI, error handling, and optimistic follow-up work."
				points={[
					{
						title: "Async work lives inside the transition",
						detail:
							"React treats the full async function as the unit of pending work instead of only the synchronous state update at the start.",
					},
					{
						title: "Best for button-initiated mutations",
						detail:
							"This pattern is useful when the user is triggering a task from a button, menu, or command surface instead of a form action.",
					},
					{
						title: "Pairs naturally with optimistic UI",
						detail:
							"useOptimistic can sit on top of the same flow when you want the screen to move before the request settles.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
				]}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Bulk owner reassignment</CardTitle>
						<CardDescription>
							This example keeps the workflow outside a form and uses an async
							transition as the action boundary.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="account-owner">New owner</Label>
							<Input
								id="account-owner"
								value={owner}
								onChange={(event) => setOwner(event.target.value)}
								placeholder="Enter a teammate name"
							/>
						</div>

						<Button onClick={handleSubmit} disabled={isPending}>
							{isPending ? "Reassigning..." : "Reassign 24 Accounts"}
						</Button>

						{error ? (
							<div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								{error}
							</div>
						) : (
							<div className="rounded-2xl border border-border/60 bg-muted/45 px-4 py-3 text-sm text-muted-foreground">
								{notice}
							</div>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Action state</CardTitle>
						<CardDescription>
							The UI can explain what just happened even though the mutation is
							not modeled as a form action.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Badge variant={isPending ? "secondary" : "outline"}>
							{isPending ? "Running" : "Idle"}
						</Badge>

						<div className="space-y-2 text-sm text-muted-foreground">
							<p>Selected accounts: 24</p>
							<p>Current assignee: {owner || "not set"}</p>
							<p>Last completed: {lastRun ?? "not yet run"}</p>
						</div>

						<div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
							<p className="font-medium text-foreground">When to use this</p>
							<p className="mt-2">
								Reach for async actions when the user is clicking a control to
								trigger a mutation, and reach for useActionState when the action
								should be driven by a form.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
