import { createContext, type ReactNode, Suspense, use, useState } from "react";
import { FeatureIntro } from "@/components/feature-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HighlightContext = createContext("Conditional context reads are allowed with use.");

const releaseBriefPromise = new Promise<{
	title: string;
	bullets: string[];
}>((resolve) => {
	setTimeout(() => {
		resolve({
			title: "React 19 data flow highlights",
			bullets: [
				"use reads Promises and suspends naturally until they resolve.",
				"Unlike most Hooks, use can be called conditionally.",
				"Promises should be created outside render or come from a cache.",
			],
		});
	}, 900);
});

function AsyncBriefCard() {
	const brief = use(releaseBriefPromise);

	return (
		<Card className="border-border/60">
			<CardHeader>
				<CardTitle>{brief.title}</CardTitle>
				<CardDescription>Read during render.</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3 text-sm text-muted-foreground">
					{brief.bullets.map((bullet) => (
						<li key={bullet} className="app-surface p-3">
							{bullet}
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function ConditionalContextNote({ visible }: { visible: boolean }) {
	if (!visible) {
		return (
			<p className="text-sm text-muted-foreground">
				Turn the note back on to call use on context after this early return.
			</p>
		);
	}

	const note = use(HighlightContext);
	return <Badge variant="secondary">{note}</Badge>;
}

function SuspensePanel({ children }: { children: ReactNode }) {
	return (
		<Suspense
			fallback={
				<Card className="border-border/60">
					<CardContent className="p-6 text-sm text-muted-foreground">Loading...</CardContent>
				</Card>
			}
		>
			{children}
		</Suspense>
	);
}

export function ReactUsePage() {
	const [showContextNote, setShowContextNote] = useState(true);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="React 19"
				title="Render-time use"
				summary="Read a Promise or context during render, with Suspense handling the async branch."
				points={[
					{
						title: "Promise read",
						detail: "Pending work falls through to Suspense.",
					},
					{
						title: "Conditional context",
						detail: "Context can be read inside a branch.",
					},
				]}
				links={[
					{
						label: "React 19 release",
						href: "https://react.dev/blog/2024/12/05/react-19",
					},
					{
						label: "use",
						href: "https://react.dev/reference/react/use",
					},
				]}
			/>

			<HighlightContext value="This note comes from context via use, not useContext.">
				<div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
					<SuspensePanel>
						<AsyncBriefCard />
					</SuspensePanel>

					<Card className="border-border/60">
						<CardHeader>
							<CardTitle>Conditional context read</CardTitle>
							<CardDescription>Toggle the branch below.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowContextNote((current) => !current)}
							>
								{showContextNote ? "Hide context note" : "Show context note"}
							</Button>

							<ConditionalContextNote visible={showContextNote} />
						</CardContent>
					</Card>
				</div>
			</HighlightContext>
		</div>
	);
}
