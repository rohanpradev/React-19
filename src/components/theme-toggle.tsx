import { Check, LaptopMinimal, type LucideIcon, MoonStar, Palette, SunMedium } from "lucide-react";
import { type Theme, themePresetOptions, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	const { theme, preset, setPreset, setTheme } = useTheme();

	return (
		<div
			className={cn(
				"inline-flex items-center gap-1 rounded-2xl border border-border/60 bg-card/75 p-1 shadow-sm shadow-black/[0.03] backdrop-blur-xl",
				className,
			)}
		>
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
							"inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground",
							isActive && "bg-foreground text-background shadow-sm shadow-black/10",
						)}
					>
						<Icon className="size-4" />
					</button>
				);
			})}

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						className="size-9 rounded-xl"
						aria-label="Choose color preset"
					>
						<Palette className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-64">
					<DropdownMenuLabel>Color preset</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{themePresetOptions.map((option) => {
						const isActive = preset === option.value;

						return (
							<DropdownMenuItem
								key={option.value}
								onSelect={() => setPreset(option.value)}
								className="items-start gap-3 py-3"
							>
								<span
									className="mt-1 size-4 shrink-0 rounded-full border border-black/10"
									style={{ backgroundImage: option.swatch }}
								/>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-medium">{option.label}</span>
									<span className="block text-xs text-muted-foreground">{option.description}</span>
								</span>
								{isActive ? <Check className="mt-1 size-4 text-primary" /> : null}
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
