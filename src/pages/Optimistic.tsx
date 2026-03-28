import { CircleAlert } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Note = {
	id: string;
	text: string;
	sending?: boolean;
};

async function saveNote(text: string) {
	await new Promise((resolve) => setTimeout(resolve, 900));

	if (text.toLowerCase().includes("fail")) {
		throw new Error("The note was rejected. Remove the word 'fail' to submit.");
	}

	return {
		id: crypto.randomUUID(),
		text,
	} satisfies Note;
}

export function UseOptimisticPage() {
	const [notes, setNotes] = useState<Note[]>([
		{
			id: "seed-1",
			text: "Usage is climbing on the enterprise cohort ahead of renewal.",
		},
		{
			id: "seed-2",
			text: "Trial accounts in EMEA need follow-up before Friday.",
		},
	]);
	const [draft, setDraft] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [optimisticNotes, addOptimisticNote] = useOptimistic(
		notes,
		(currentNotes, optimisticText: string) => [
			{
				id: `optimistic-${optimisticText}`,
				text: optimisticText,
				sending: true,
			},
			...currentNotes,
		],
	);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();

		const nextDraft = draft.trim();
		if (!nextDraft) {
			return;
		}

		startTransition(async () => {
			setError(null);
			addOptimisticNote(nextDraft);
			setDraft("");

			try {
				const savedNote = await saveNote(nextDraft);
				setNotes((currentNotes) => [savedNote, ...currentNotes]);
			} catch (caughtError) {
				setError(
					caughtError instanceof Error
						? caughtError.message
						: "The note could not be saved.",
				);
			}
		});
	};

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Optimistic UI with useOptimistic"
				summary="useOptimistic lets the interface move first while the request is still running. The optimistic layer disappears automatically if the real state never commits, which makes rollback logic much simpler."
				points={[
					{
						title: "Optimistic state is layered over real state",
						detail:
							"You keep the committed data as the source of truth and derive a temporary optimistic version only while the request is in flight.",
					},
					{
						title: "Rollback is implicit",
						detail:
							"If the request fails and the committed state never updates, the optimistic entry falls away without separate rollback bookkeeping.",
					},
					{
						title: "Pairs well with actions",
						detail:
							"The optimistic update can run inside the same transition or form action that is sending the request.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "useOptimistic",
						href: "https://react.dev/reference/react/useOptimistic",
					},
				]}
			/>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>Renewal notes</CardTitle>
						<CardDescription>
							Type a note and submit it. Include the word "fail" to see the
							optimistic entry disappear when the request is rejected.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5">
						<form onSubmit={handleSubmit} className="space-y-3">
							<Textarea
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								placeholder="Add a renewal, expansion, or risk note..."
							/>
							<Button
								type="submit"
								disabled={isPending || draft.trim().length === 0}
							>
								{isPending ? "Saving..." : "Add Note"}
							</Button>
						</form>

						{error ? (
							<Alert variant="destructive">
								<CircleAlert />
								<div className="space-y-1">
									<AlertTitle>Save failed</AlertTitle>
									<AlertDescription>{error}</AlertDescription>
								</div>
							</Alert>
						) : null}

						<div className="space-y-3">
							{optimisticNotes.map((note) => (
								<div key={note.id} className="app-surface px-4 py-3">
									<div className="flex items-start justify-between gap-4">
										<p className="text-sm leading-6 text-foreground/80">
											{note.text}
										</p>
										{note.sending ? (
											<Badge variant="secondary">Sending...</Badge>
										) : (
											<Badge variant="outline">Saved</Badge>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/60">
					<CardHeader>
						<CardTitle>What the hook is doing</CardTitle>
						<CardDescription>
							The optimistic list renders immediately, but the committed list is
							only updated after the async save succeeds.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm text-muted-foreground">
						<p>Committed notes: {notes.length}</p>
						<p>Rendered notes: {optimisticNotes.length}</p>
						<p>Pending request: {String(isPending)}</p>

						<div className="app-muted-surface p-4">
							<p className="font-medium text-foreground">Why this matters</p>
							<p className="mt-2">
								Optimistic interfaces feel instant, but they are only safe when
								you can cleanly reconcile success and failure. useOptimistic
								keeps that logic small.
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
