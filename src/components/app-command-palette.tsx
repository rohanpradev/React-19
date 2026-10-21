import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
	ArrowUpRight,
	BookOpenText,
	LaptopMinimal,
	MoonStar,
	SearchIcon,
	SunMedium,
} from "lucide-react";

import { authClient } from "@/auth/client";
import { hasPermission, permissions } from "@/auth/permissions";
import { TechLogo } from "@/components/tech-logo";
import { themePresetOptions, useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { accessNavItem, learningStages, navItems, workspaceNavItems } from "@/lib/navigation";
import { officialDocLinks } from "@/lib/official-docs";
import { cn } from "@/lib/utils";

export function AppCommandPalette({ buttonClassName }: { buttonClassName?: string }) {
	const [open, setOpen] = useState(false);
	const isNavigating = useRef(false);
	const location = useLocation();
	const navigate = useNavigate();
	const { setPreset, setTheme } = useTheme();
	const { data: session } = authClient.useSession();
	const visibleWorkspaceItems = workspaceNavItems.filter(
		(item) =>
			item.path !== accessNavItem.path || hasPermission(session?.user.role, permissions.accessRead),
	);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				isNavigating.current = false;
				setOpen((current) => !current);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<CommandDialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (nextOpen) isNavigating.current = false;
				setOpen(nextOpen);
			}}
			onCloseAutoFocus={(event) => {
				// A new route owns focus; cancelling or choosing an action returns it to search.
				if (isNavigating.current) event.preventDefault();
			}}
			title="Project command palette"
			description="Jump to demos, docs, or quick theme actions. Use arrow keys to browse and Enter to select."
			className="sm:max-w-3xl"
			trigger={
				<Button
					type="button"
					variant="outline"
					aria-label="Open command palette"
					aria-keyshortcuts="Control+k Meta+k"
					className={cn(
						"min-w-0 justify-between gap-2 rounded-lg px-3 text-left sm:min-w-[240px] sm:gap-3 sm:px-4",
						buttonClassName,
					)}
				>
					<span className="flex min-w-0 items-center gap-2">
						<SearchIcon className="size-4 shrink-0" />
						<span className="truncate sm:hidden">Search</span>
						<span className="hidden sm:inline">Search routes or docs</span>
					</span>
					<KbdGroup className="hidden sm:inline-flex">
						<Kbd>Ctrl</Kbd>
						<Kbd>K</Kbd>
					</KbdGroup>
				</Button>
			}
		>
			<CommandInput
				aria-label="Search routes, docs, or actions"
				placeholder="Search routes, APIs, docs, or quick actions..."
			/>
			<CommandList className="max-h-[min(480px,calc(100dvh-5rem))]">
				<CommandEmpty>No matching pages or docs.</CommandEmpty>

				<CommandGroup heading="Workspace">
					{visibleWorkspaceItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.path === location.pathname;

						return (
							<CommandItem
								key={item.path}
								keywords={[item.releaseArea, ...item.apiLabels]}
								value={`${item.label} ${item.blurb} ${item.releaseArea} ${item.apiLabels.join(" ")}`}
								onSelect={() => {
									isNavigating.current = item.path !== location.pathname;
									void navigate(item.path);
									setOpen(false);
								}}
								className="items-start gap-3 py-3"
							>
								<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Icon className="size-5" />
								</div>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium">{item.label}</p>
										{isActive ? <Badge variant="secondary">Current</Badge> : null}
									</div>
									<p className="text-sm leading-5 text-muted-foreground">{item.blurb}</p>
								</div>
								<CommandShortcut className="hidden sm:block">Private workspace</CommandShortcut>
							</CommandItem>
						);
					})}
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Learning Routes">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = item.path === location.pathname;

						return (
							<CommandItem
								key={item.path}
								keywords={[item.releaseArea, ...item.apiLabels]}
								value={`${item.label} ${item.blurb} ${item.releaseArea} ${item.apiLabels.join(" ")}`}
								onSelect={() => {
									isNavigating.current = item.path !== location.pathname;
									void navigate(item.path);
									setOpen(false);
								}}
								className="items-start gap-3 py-3"
							>
								<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Icon className="size-5" />
								</div>
								<div className="min-w-0 flex-1 space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<p className="font-medium">{item.label}</p>
										{isActive ? <Badge variant="secondary">Current</Badge> : null}
									</div>
									<p className="text-sm leading-5 text-muted-foreground">{item.blurb}</p>
									<div className="flex flex-wrap gap-2">
										<Badge variant="outline">{item.releaseArea}</Badge>
										{item.apiLabels.map((api) => (
											<Badge key={api} variant="outline" className="text-[11px]">
												{api}
											</Badge>
										))}
									</div>
								</div>
								<CommandShortcut className="hidden sm:block">
									{learningStages[item.stage]}
								</CommandShortcut>
							</CommandItem>
						);
					})}
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Official Docs">
					{officialDocLinks.map((link) => (
						<CommandItem
							key={link.href}
							keywords={link.keywords}
							value={`${link.label} ${link.description} ${link.keywords.join(" ")}`}
							onSelect={() => {
								window.open(link.href, "_blank", "noopener,noreferrer");
								setOpen(false);
							}}
							className="items-start gap-3 py-3"
						>
							<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/40 text-accent-foreground">
								{link.logo ? (
									<TechLogo name={link.logo} className="size-5" />
								) : (
									<BookOpenText className="size-5" />
								)}
							</div>
							<div className="min-w-0 flex-1 space-y-1">
								<p className="font-medium">{link.label}</p>
								<p className="text-sm leading-5 text-muted-foreground">{link.description}</p>
							</div>
							<ArrowUpRight className="mt-1 size-4 text-muted-foreground" />
						</CommandItem>
					))}
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Theme">
					<CommandItem
						onSelect={() => {
							setTheme("light");
							setOpen(false);
						}}
					>
						<SunMedium className="size-4" />
						Light theme
					</CommandItem>
					<CommandItem
						onSelect={() => {
							setTheme("dark");
							setOpen(false);
						}}
					>
						<MoonStar className="size-4" />
						Dark theme
					</CommandItem>
					<CommandItem
						onSelect={() => {
							setTheme("system");
							setOpen(false);
						}}
					>
						<LaptopMinimal className="size-4" />
						System theme
					</CommandItem>
				</CommandGroup>

				<CommandSeparator />

				<CommandGroup heading="Theme Presets">
					{themePresetOptions.map((option) => (
						<CommandItem
							key={option.value}
							value={`${option.label} ${option.description} theme preset`}
							onSelect={() => {
								setPreset(option.value);
								setOpen(false);
							}}
						>
							<span
								className="size-3 rounded-md border border-black/10"
								style={{ backgroundImage: option.swatch }}
							/>
							{option.label} preset
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
