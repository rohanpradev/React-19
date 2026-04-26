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
		<section className="space-y-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{eyebrow}</Badge>
						{points.slice(0, 3).map((point) => (
							<Badge
								key={point.title}
								variant="outline"
								className="rounded-full"
								title={point.detail}
							>
								{point.title}
							</Badge>
						))}
					</div>

					<div className="space-y-2">
						<h1 className="font-display text-3xl leading-none text-foreground sm:text-4xl">
							{title}
						</h1>
						<p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
							{summary}
						</p>
					</div>
				</div>

				{links.length > 0 ? (
					<div className="flex flex-wrap gap-2">
						{links.slice(0, 3).map((link) => (
							<Button
								key={link.href}
								variant="ghost"
								size="sm"
								asChild
								className="h-9 rounded-full px-3"
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
		</section>
	);
}
