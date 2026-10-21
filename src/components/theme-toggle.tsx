import { LaptopMinimal, type LucideIcon, MoonStar, Palette, SunMedium } from "lucide-react";

import { type Theme, themePresetOptions, useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
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
		<fieldset
			className={cn(
				"inline-flex items-center gap-1 rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm shadow-black/[0.03]",
				className,
			)}
		>
			<legend className="sr-only">Appearance</legend>
			{themeOptions.map((option) => {
				const Icon = option.icon;
				const isActive = theme === option.value;

				return (
					<button
						key={option.value}
						type="button"
						onClick={() => setTheme(option.value)}
						title={option.label}
						aria-label={`${option.label} theme`}
						aria-pressed={isActive}
						className={cn(
							"inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground sm:size-9",
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
						className="size-8 rounded-md sm:size-9"
						aria-label="Choose color preset"
					>
						<Palette className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-64">
					<DropdownMenuLabel>Color preset</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup
						value={preset}
						onValueChange={(value) => {
							const option = themePresetOptions.find((option) => option.value === value);
							if (option) setPreset(option.value);
						}}
					>
						{themePresetOptions.map((option) => (
							<DropdownMenuRadioItem
								key={option.value}
								value={option.value}
								className="items-start gap-3 py-3"
							>
								<span
									className="mt-1 size-4 shrink-0 rounded-md border border-black/10"
									style={{ backgroundImage: option.swatch }}
								/>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-medium">{option.label}</span>
									<span className="block text-xs text-muted-foreground">{option.description}</span>
								</span>
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</fieldset>
	);
}
