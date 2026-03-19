import { createContext, type ReactNode, Suspense, use, useState } from "react";
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

const HighlightContext = createContext(
	"Conditional context reads are allowed with use.",
);

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
				<CardDescription>
					This card is reading a Promise during render.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ul className="space-y-3 text-sm text-muted-foreground">
					{brief.bullets.map((bullet) => (
						<li
							key={bullet}
							className="rounded-2xl border border-border/60 p-3"
						>
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
					<CardContent className="p-6 text-sm text-muted-foreground">
						Resolving the Promise with Suspense...
					</CardContent>
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
				summary="The new use API reads a Promise or context during render. It integrates with Suspense for async work, and unlike most Hooks it can be called conditionally."
				points={[
					{
						title: "Promises suspend the component",
						detail:
							"When use reads a pending Promise, React pauses that branch and renders the nearest Suspense fallback until the Promise resolves.",
					},
					{
						title: "Context reads can be conditional",
						detail:
							"use can read context after an early return or inside branches where useContext would not be allowed.",
					},
					{
						title: "This page uses two React 19 APIs together",
						detail:
							"The Promise is cached outside render, and the provider below uses the new shorter <Context value={...}> syntax.",
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
							<CardDescription>
								This demo flips a branch before calling use on context.
							</CardDescription>
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

							<div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
								<p className="font-medium text-foreground">Why this matters</p>
								<p className="mt-2">
									The Promise on the left is created outside render, matching
									the release-note guidance, and the provider itself is using
									React 19's new shorthand syntax.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>
			</HighlightContext>
		</div>
	);
}
