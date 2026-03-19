// src/App.tsx
import {
	ChartColumnIncreasing,
	FilePenLine,
	FlaskConical,
	type LucideIcon,
	Orbit,
	PanelTopOpen,
	Rocket,
	Search,
	Sparkles,
	Workflow,
} from "lucide-react";
import {
	Navigate,
	NavLink,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ActionsPage } from "@/pages/Actions";
import { DomInteropPage } from "@/pages/DomInterop";
import { FormActionsPage } from "@/pages/FormActions";
import { UseOptimisticPage } from "@/pages/Optimistic";
import { React19OverviewPage } from "@/pages/React19OverviewPage";
import { ReactUsePage } from "@/pages/ReactUse";
import { SearchDebounce } from "@/pages/SearchDebounce";
import { ServerTablePage } from "@/pages/ServerTable";

import "./index.css";

type NavItem = {
	path: string;
	label: string;
	blurb: string;
	icon: LucideIcon;
};

const links: [NavItem, ...NavItem[]] = [
	{
		path: "/react-19",
		label: "React 19 Overview",
		blurb: "Release notes mapped to concrete pages in the app.",
		icon: Sparkles,
	},
	{
		path: "/form-actions",
		label: "Form Actions",
		blurb: "Function actions, pending state, and returned UI state.",
		icon: FilePenLine,
	},
	{
		path: "/actions",
		label: "Async Actions",
		blurb: "Button-driven mutations with transitions and feedback.",
		icon: Workflow,
	},
	{
		path: "/optimistic",
		label: "Optimistic UI",
		blurb: "Immediate UI moves with clean success and rollback behavior.",
		icon: Rocket,
	},
	{
		path: "/react-use",
		label: "use + Suspense",
		blurb: "Promises and conditional context reads during render.",
		icon: Orbit,
	},
	{
		path: "/dom-interop",
		label: "DOM + Head APIs",
		blurb: "Metadata, refs, and custom element interop in React 19.",
		icon: PanelTopOpen,
	},
	{
		path: "/search-debounce",
		label: "Search + Deferred",
		blurb: "Debounced search shaped with useDeferredValue.",
		icon: Search,
	},
	{
		path: "/revenue-ops",
		label: "Revenue Ops",
		blurb: "Server-side table state powered by Bun, Drizzle, and SQLite.",
		icon: ChartColumnIncreasing,
	},
];

export function App() {
	const location = useLocation();
	const activeLink =
		links.find(({ path }) => location.pathname === path) ?? links[0];
	const ActiveIcon = activeLink.icon;

	return (
		<div className="min-h-screen w-full">
			<div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-3 sm:p-4 lg:p-6">
				<aside className="hidden w-[320px] shrink-0 lg:flex">
					<div className="flex w-full flex-col gap-6 rounded-[2rem] border border-sidebar-border/70 bg-sidebar/78 p-6 shadow-2xl shadow-black/[0.06] backdrop-blur-xl dark:shadow-black/[0.32]">
						<div className="space-y-4">
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
										<FlaskConical className="size-6" />
									</div>
									<div className="space-y-1">
										<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
											Bun + React Lab
										</p>
										<h2 className="font-display text-2xl text-sidebar-foreground">
											Interface Studio
										</h2>
									</div>
								</div>
								<ThemeToggle />
							</div>

							<div className="rounded-[1.5rem] border border-sidebar-border/60 bg-background/55 p-4">
								<p className="text-sm leading-6 text-muted-foreground">
									A themed sandbox for React 19, server-side data flows, and
									polished component work built on shadcn-style tokens.
								</p>
							</div>
						</div>

						<ScrollArea className="flex-1 pr-2">
							<nav className="space-y-2">
								{links.map((link) => {
									const Icon = link.icon;

									return (
										<NavLink
											key={link.path}
											to={link.path}
											className={({ isActive }) =>
												cn(
													"group flex items-start gap-3 rounded-[1.4rem] border border-transparent px-4 py-3 transition-all duration-200",
													isActive
														? "border-sidebar-primary/20 bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/[0.16]"
														: "text-sidebar-foreground hover:border-sidebar-border/70 hover:bg-sidebar-accent/80",
												)
											}
										>
											<div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background/40 text-current transition-colors group-hover:bg-background/60">
												<Icon className="size-5" />
											</div>
											<div className="min-w-0 space-y-1">
												<p className="font-medium">{link.label}</p>
												<p className="text-sm leading-5 text-current/70">
													{link.blurb}
												</p>
											</div>
										</NavLink>
									);
								})}
							</nav>
						</ScrollArea>

						<div className="rounded-[1.5rem] border border-sidebar-border/60 bg-background/55 p-4">
							<p className="text-sm font-medium text-sidebar-foreground">
								Theme-aware shell
							</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								Light and dark modes are driven by the same shadcn token system,
								not a separate layer of one-off overrides.
							</p>
						</div>
					</div>
				</aside>

				<div className="flex min-w-0 flex-1 flex-col gap-4">
					<header className="rounded-[1.75rem] border border-border/65 bg-background/70 p-4 shadow-xl shadow-black/[0.05] backdrop-blur-xl dark:shadow-black/[0.28]">
						<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-4">
								<div className="flex size-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
									<ActiveIcon className="size-6" />
								</div>
								<div className="space-y-1">
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="secondary">Active route</Badge>
										<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
											React 19 + Bun sandbox
										</p>
									</div>
									<p className="font-medium text-foreground">
										{activeLink.label}
									</p>
									<p className="text-sm text-muted-foreground">
										{activeLink.blurb}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3 self-start sm:self-auto lg:hidden">
								<ThemeToggle />
							</div>
						</div>

						<div className="mt-4 lg:hidden">
							<ScrollArea className="w-full whitespace-nowrap">
								<div className="flex gap-2 pb-1">
									{links.map((link) => {
										const Icon = link.icon;

										return (
											<NavLink
												key={link.path}
												to={link.path}
												className={({ isActive }) =>
													cn(
														"inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all duration-200",
														isActive
															? "border-primary/20 bg-primary text-primary-foreground shadow-sm shadow-black/[0.14]"
															: "border-border/70 bg-background/80 text-muted-foreground hover:bg-accent/70 hover:text-accent-foreground",
													)
												}
											>
												<Icon className="size-4" />
												{link.label}
											</NavLink>
										);
									})}
								</div>
							</ScrollArea>
						</div>
					</header>

					<main className="relative min-w-0 flex-1 overflow-hidden rounded-[2rem] border border-border/65 bg-background/72 p-4 shadow-2xl shadow-black/[0.06] backdrop-blur-xl sm:p-6 lg:p-8 dark:shadow-black/[0.32]">
						<div className="pointer-events-none absolute inset-0">
							<div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
							<div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-accent/18 blur-3xl" />
						</div>
						<div className="relative">
							<Routes>
								<Route path="/" element={<Navigate to="/react-19" replace />} />
								<Route path="/react-19" element={<React19OverviewPage />} />
								<Route path="/form-actions" element={<FormActionsPage />} />
								<Route path="/revenue-ops" element={<ServerTablePage />} />
								<Route path="/react-use" element={<ReactUsePage />} />
								<Route path="/dom-interop" element={<DomInteropPage />} />
								<Route path="/search-debounce" element={<SearchDebounce />} />
								<Route path="/actions" element={<ActionsPage />} />
								<Route path="/optimistic" element={<UseOptimisticPage />} />
							</Routes>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}

export default App;
