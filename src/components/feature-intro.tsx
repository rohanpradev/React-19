import {
	ArrowUpRight,
	type LucideIcon,
	ShieldCheck,
	Sparkles,
	Waypoints,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

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
			<div className="relative overflow-hidden rounded-[2rem] border border-border/65 bg-card/82 p-6 shadow-xl shadow-black/[0.05] backdrop-blur-xl sm:p-8 dark:shadow-black/[0.28]">
				<div className="pointer-events-none absolute inset-0">
					<div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-primary/12 blur-3xl" />
					<div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent/16 blur-3xl" />
				</div>

				<div className="relative space-y-6">
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
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				{points.map((point, index) => {
					const Icon = pointIcons[index % pointIcons.length] ?? Sparkles;

					return (
						<Card key={point.title}>
							<CardHeader className="pb-3">
								<div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
									<Icon className="size-5" />
								</div>
								<CardTitle className="text-base">{point.title}</CardTitle>
							</CardHeader>
							<CardContent>
								<CardDescription className="text-sm leading-6">
									{point.detail}
								</CardDescription>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}
