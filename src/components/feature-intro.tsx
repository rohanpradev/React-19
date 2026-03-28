import {
	ArrowUpRight,
	type LucideIcon,
	ShieldCheck,
	Sparkles,
	Waypoints,
} from "lucide-react";
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

export function FeatureIntro({
	eyebrow,
	title,
	summary,
	points,
	links = [],
}: FeatureIntroProps) {
	const pointIcons: [LucideIcon, LucideIcon, LucideIcon] = [
		Sparkles,
		Waypoints,
		ShieldCheck,
	];

	return (
		<div className="space-y-6">
			<div className="relative overflow-hidden rounded-[1.9rem] border border-border/70 bg-card/96 p-6 shadow-[0_24px_50px_-32px_rgba(15,23,42,0.34)] sm:p-8 dark:shadow-[0_28px_60px_-34px_rgba(2,6,23,0.82)]">
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
					<div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
				</div>

				<div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
					<div className="space-y-5">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">{eyebrow}</Badge>
							{links.map((link) => (
								<Button key={link.href} variant="outline" size="sm" asChild>
									<a href={link.href} target="_blank" rel="noreferrer">
										{link.label}
										<ArrowUpRight className="size-4" />
									</a>
								</Button>
							))}
						</div>

						<div className="space-y-4">
							<h1 className="font-display max-w-4xl text-4xl leading-none text-foreground sm:text-5xl">
								{title}
							</h1>
							<p className="max-w-3xl text-base leading-7 text-muted-foreground">
								{summary}
							</p>
						</div>
					</div>

					<div className="app-surface rounded-[1.45rem] p-5">
						<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
							What to notice
						</p>
						<div className="mt-4 space-y-3">
							{points.map((point, index) => {
								const Icon = pointIcons[index % pointIcons.length] ?? Sparkles;

								return (
									<div
										key={point.title}
										className="app-muted-surface rounded-[1.1rem] p-4"
									>
										<div className="flex items-start gap-3">
											<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
												<Icon className="size-4" />
											</div>
											<div>
												<p className="font-medium text-foreground">
													{point.title}
												</p>
												<p className="mt-1 text-sm leading-6 text-muted-foreground">
													{point.detail}
												</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
