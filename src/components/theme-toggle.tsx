import {
	LaptopMinimal,
	type LucideIcon,
	MoonStar,
	SunMedium,
} from "lucide-react";
import { type Theme, useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const themeOptions: {
	value: Theme;
	label: string;
	icon: LucideIcon;
}[] = [
	{ value: "light", label: "Light", icon: SunMedium },
	{ value: "dark", label: "Dark", icon: MoonStar },
	{ value: "system", label: "System", icon: LaptopMinimal },
];

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, resolvedTheme, setTheme } = useTheme();

	return (
		<div
			className={cn(
				"inline-flex min-w-0 max-w-full items-center gap-2 rounded-[1.25rem] border border-border/60 bg-background/80 p-1.5 shadow-lg shadow-black/[0.05] backdrop-blur-xl dark:shadow-black/[0.25]",
				className,
			)}
		>
			<div className="grid shrink-0 grid-cols-3 gap-1 rounded-[1rem] bg-muted/35 p-1">
				{themeOptions.map((option) => {
					const Icon = option.icon;
					const isActive = theme === option.value;

					return (
						<button
							key={option.value}
							type="button"
							onClick={() => setTheme(option.value)}
							title={option.label}
							aria-label={option.label}
							aria-pressed={isActive}
							className={cn(
								"inline-flex h-9 min-w-9 items-center justify-center rounded-[0.85rem] border border-transparent px-2 text-muted-foreground transition-all duration-200 hover:bg-background/80 hover:text-foreground",
								isActive &&
									"border-primary/20 bg-primary text-primary-foreground shadow-sm shadow-black/[0.12]",
							)}
						>
							<Icon className="size-4" />
						</button>
					);
				})}
			</div>

			<span className="hidden truncate rounded-full bg-muted/45 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase xl:inline-flex">
				{resolvedTheme === "dark" ? "Night mode" : "Day mode"}
			</span>
		</div>
	);
}
