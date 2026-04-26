import { CircleAlert, Info } from "lucide-react";
import { useState, useTransition } from "react";
import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
	const [notice, setNotice] = useState("24 expansion accounts are currently selected.");
	const [error, setError] = useState<string | null>(null);
	const [lastRun, setLastRun] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		startTransition(async () => {
			setError(null);

			try {
				const result = await reassignAccounts(owner);
				startTransition(() => {
					setNotice(`${result.updatedCount} accounts were moved to ${result.owner}.`);
					setLastRun(result.completedAt);
				});
			} catch (caughtError) {
				startTransition(() => {
					setError(
						caughtError instanceof Error
							? caughtError.message
							: "The action could not be completed.",
					);
				});
			}
		});
	};

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Async Actions with startTransition"
				summary="Use this when a button kicks off async work and the UI needs a pending state."
				points={[
					{
						title: "Button-driven mutation",
						detail: "Good fit when there is no form submit boundary.",
					},
					{
						title: "Pending state included",
						detail: "The transition keeps the control disabled while work runs.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "useTransition",
						href: "https://react.dev/reference/react/useTransition",
					},
				]}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Bulk owner reassignment</CardTitle>
						<CardDescription>Move selected accounts to a new owner.</CardDescription>
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
							<Alert variant="destructive">
								<CircleAlert />
								<div className="space-y-1">
									<AlertTitle>Batch action failed</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</div>
							</Alert>
						) : (
							<Alert variant="info">
								<Info />
								<div className="space-y-1">
									<AlertTitle>Current selection</AlertTitle>
									<AlertDescription>{notice}</AlertDescription>
								</div>
							</Alert>
						)}
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Action state</CardTitle>
						<CardDescription>Current run state.</CardDescription>
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
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
