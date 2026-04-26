import { LaptopMinimal, type LucideIcon, MoonStar, SunMedium } from "lucide-react";
import { type Theme, themePresetOptions, useTheme } from "@/components/theme-provider";
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
	const { theme, resolvedTheme, preset, setPreset, setTheme } = useTheme();

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

			<div className="hidden flex-wrap gap-1 rounded-[1rem] bg-muted/35 p-1 2xl:flex">
				{themePresetOptions.map((option) => {
					const isActive = preset === option.value;

					return (
						<button
							key={option.value}
							type="button"
							onClick={() => setPreset(option.value)}
							title={option.description}
							aria-label={`${option.label} preset`}
							aria-pressed={isActive}
							className={cn(
								"inline-flex min-w-0 flex-1 items-center gap-2 rounded-[0.85rem] border border-transparent px-2.5 py-2 text-left text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-background/80 hover:text-foreground",
								isActive &&
									"border-primary/20 bg-background text-foreground shadow-sm shadow-black/[0.1]",
							)}
						>
							<span
								className="size-3 shrink-0 rounded-full border border-black/10"
								style={{ backgroundImage: option.swatch }}
							/>
							<span className="truncate">{option.label}</span>
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
