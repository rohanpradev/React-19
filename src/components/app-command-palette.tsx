import {
	ArrowUpRight,
	BookOpenText,
	LaptopMinimal,
	MoonStar,
	SearchIcon,
	SunMedium,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
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
import { learningStages, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type DocsLink = {
	label: string;
	description: string;
	href: string;
	keywords: string[];
};

const docsLinks: DocsLink[] = [
	{
		label: "React 19 release",
		description: "Stable release notes and adoption guidance.",
		href: "https://react.dev/blog/2024/12/05/react-19",
		keywords: ["react", "actions", "use", "metadata"],
	},
	{
		label: "shadcn Command",
		description: "Command palette patterns built on cmdk.",
		href: "https://ui.shadcn.com/docs/components/command",
		keywords: ["shadcn", "command", "palette", "cmdk"],
	},
	{
		label: "shadcn Tailwind v4",
		description: "React 19 and Tailwind v4 alignment notes.",
		href: "https://ui.shadcn.com/docs/tailwind-v4",
		keywords: ["shadcn", "tailwind", "v4", "react 19"],
	},
	{
		label: "Bun fullstack server",
		description: "HTML imports, routes, and production bundling.",
		href: "https://bun.sh/docs/bundler/fullstack",
		keywords: ["bun", "serve", "routes", "html imports"],
	},
	{
		label: "Better Auth Bun SQLite",
		description: "Official Bun built-in SQLite adapter guidance.",
		href: "https://better-auth.com/docs/adapters/sqlite#bun-built-in-sqlite",
		keywords: ["better auth", "bun", "sqlite", "auth"],
	},
	{
		label: "Better Auth Google",
		description: "Official Google OAuth provider setup.",
		href: "https://better-auth.com/docs/authentication/google",
		keywords: ["better auth", "google", "oauth", "auth"],
	},
	{
		label: "Better Auth GitHub",
		description: "Official GitHub OAuth provider setup.",
		href: "https://better-auth.com/docs/authentication/github",
		keywords: ["better auth", "github", "oauth", "auth"],
	},
];

export function AppCommandPalette({
	buttonClassName,
}: {
	buttonClassName?: string;
}) {
	const [open, setOpen] = useState(false);
	const location = useLocation();
	const navigate = useNavigate();
	const { setTheme } = useTheme();

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((current) => !current);
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<>
			<Button
				type="button"
				variant="outline"
				className={cn(
					"justify-between gap-3 rounded-2xl px-4 text-left sm:min-w-[240px]",
					buttonClassName,
				)}
				onClick={() => setOpen(true)}
			>
				<span className="flex items-center gap-2">
					<SearchIcon className="size-4" />
					Search routes or docs
				</span>
				<span className="rounded-lg border border-border/70 bg-background/80 px-2 py-1 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
					Ctrl K
				</span>
			</Button>

			<CommandDialog
				open={open}
				onOpenChange={setOpen}
				title="Project command palette"
				description="Jump to demos, docs, or quick theme actions."
				className="max-w-3xl"
			>
				<CommandInput placeholder="Search routes, APIs, docs, or quick actions..." />
				<CommandList className="max-h-[480px]">
					<CommandEmpty>No matching pages or docs.</CommandEmpty>

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
										navigate(item.path);
										setOpen(false);
									}}
									className="items-start gap-3 py-3"
								>
									<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
										<Icon className="size-5" />
									</div>
									<div className="min-w-0 flex-1 space-y-1">
										<div className="flex flex-wrap items-center gap-2">
											<p className="font-medium">{item.label}</p>
											{isActive ? (
												<Badge variant="secondary">Current</Badge>
											) : null}
										</div>
										<p className="text-sm leading-5 text-muted-foreground">
											{item.blurb}
										</p>
										<div className="flex flex-wrap gap-2">
											<Badge variant="outline">{item.releaseArea}</Badge>
											{item.apiLabels.map((api) => (
												<Badge
													key={api}
													variant="outline"
													className="text-[11px]"
												>
													{api}
												</Badge>
											))}
										</div>
									</div>
									<CommandShortcut>
										{learningStages[item.stage]}
									</CommandShortcut>
								</CommandItem>
							);
						})}
					</CommandGroup>

					<CommandSeparator />

					<CommandGroup heading="Official Docs">
						{docsLinks.map((link) => (
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
								<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-accent-foreground">
									<BookOpenText className="size-5" />
								</div>
								<div className="min-w-0 flex-1 space-y-1">
									<p className="font-medium">{link.label}</p>
									<p className="text-sm leading-5 text-muted-foreground">
										{link.description}
									</p>
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
				</CommandList>
			</CommandDialog>
		</>
	);
}
