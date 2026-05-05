import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FeaturePoint = {
	title: string;
	detail: string;
};

type FeatureLink = {
	label: string;
	href: string;
};

type FeatureIntroProps = {
	eyebrow: string;
	title: string;
	summary: string;
	points: FeaturePoint[];
	links?: FeatureLink[];
};

export function FeatureIntro({ eyebrow, title, summary, points, links = [] }: FeatureIntroProps) {
	return (
		<section className="app-hero p-5 sm:p-7 lg:p-8">
			<div className="pointer-events-none absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

			<div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.38fr)] lg:items-end">
				<div className="space-y-4">
					<Badge variant="secondary" className="w-fit rounded-full">
						{eyebrow}
					</Badge>

					<div className="space-y-3">
						<h1 className="max-w-4xl font-display text-4xl leading-[0.95] text-foreground sm:text-5xl">
							{title}
						</h1>
						<p className="max-w-2xl text-base leading-7 text-muted-foreground">{summary}</p>
					</div>
				</div>

				{links.length > 0 ? (
					<div className="flex flex-wrap gap-2 lg:justify-end">
						{links.slice(0, 3).map((link) => (
							<Button
								key={link.href}
								variant="outline"
								size="sm"
								asChild
								className="h-9 rounded-full bg-card/70 px-3"
							>
								<a href={link.href} target="_blank" rel="noreferrer">
									{link.label}
									<ArrowUpRight className="size-4" />
								</a>
							</Button>
						))}
					</div>
				) : null}
			</div>

			<div className="relative mt-6 grid gap-2 sm:grid-cols-3">
				{points.slice(0, 3).map((point) => (
					<div key={point.title} className="rounded-2xl border border-border/55 bg-muted/35 p-3">
						<p className="text-sm font-medium text-foreground" title={point.detail}>
							{point.title}
						</p>
					</div>
				))}
			</div>
		</section>
	);
}
