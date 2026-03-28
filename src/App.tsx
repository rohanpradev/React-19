import { BookOpenText, Layers3, Rocket } from "lucide-react";
import {
	Navigate,
	NavLink,
	Route,
	Routes,
	useLocation,
} from "react-router-dom";
import { AppCommandPalette } from "@/components/app-command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { appIdentity, learningStages, navItems } from "@/lib/navigation";
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

const showcaseStats = [
	{
		label: "React 19 demos",
		value: "6 core routes",
		icon: Rocket,
	},
	{
		label: "UI surfaces",
		value: "shadcn shell + palette",
		icon: Layers3,
	},
	{
		label: "Runtime",
		value: "Bun routes + HTML imports",
		icon: BookOpenText,
	},
] as const;

export function App() {
	const location = useLocation();
	const activeLink =
		navItems.find(({ path }) => location.pathname === path) ?? navItems[0];
	const ActiveIcon = activeLink.icon;
	const IdentityIcon = appIdentity.icon;

	return (
		<div className="min-h-screen w-full">
			<div className="mx-auto grid min-h-screen max-w-[1560px] gap-4 p-3 sm:p-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 lg:p-6">
				<aside className="hidden lg:block">
					<div className="sticky top-6 flex max-h-[calc(100vh-3rem)] flex-col gap-5 overflow-y-auto rounded-[2.2rem] border border-sidebar-border/70 bg-sidebar/80 p-5 shadow-2xl shadow-black/[0.06] backdrop-blur-xl dark:shadow-black/[0.32]">
						<div className="shrink-0 rounded-[1.8rem] border border-sidebar-border/60 bg-background/58 p-5">
							<div className="flex min-w-0 items-start gap-3">
								<div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
									<IdentityIcon className="size-6" />
								</div>
								<div className="min-w-0 space-y-1">
									<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
										{appIdentity.label}
									</p>
									<h2 className="font-display text-2xl text-sidebar-foreground">
										{appIdentity.title}
									</h2>
								</div>
							</div>

							<p className="mt-4 text-sm leading-6 text-muted-foreground">
								{appIdentity.description}
							</p>

							<div className="mt-4 flex flex-wrap gap-2">
								<Badge variant="secondary">React 19.2</Badge>
								<Badge variant="outline">shadcn/ui</Badge>
								<Badge variant="outline">Bun full-stack</Badge>
							</div>

							<div className="mt-5 rounded-[1.4rem] border border-sidebar-border/60 bg-background/46 p-3">
								<div className="space-y-1 px-1">
									<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
										Appearance
									</p>
									<p className="text-sm leading-6 text-muted-foreground">
										Theme controls stay in the sidebar on desktop so the content
										area stays clean.
									</p>
								</div>
								<ThemeToggle className="mt-3 w-full justify-between" />
							</div>
						</div>

						<div className="rounded-[1.8rem] border border-sidebar-border/60 bg-background/52 p-3">
							<div className="px-3 pb-3">
								<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
									Learning routes
								</p>
								<p className="mt-2 text-sm leading-6 text-muted-foreground">
									Move from release overview to focused demos and the applied
									full-stack page.
								</p>
							</div>

							<nav className="space-y-2 pb-2">
								{navItems.map((link) => {
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
												<div className="flex flex-wrap items-center gap-2">
													<p className="font-medium">{link.label}</p>
													<Badge
														variant="outline"
														className="border-current/20 bg-background/40 text-[10px] text-current/75"
													>
														{learningStages[link.stage]}
													</Badge>
												</div>
												<p className="text-sm leading-5 text-current/70">
													{link.blurb}
												</p>
												<div className="flex flex-wrap gap-2 pt-1">
													{link.apiLabels.slice(0, 2).map((api) => (
														<span
															key={api}
															className="rounded-full border border-current/15 bg-background/35 px-2 py-1 text-[10px] font-medium tracking-[0.12em] text-current/70 uppercase"
														>
															{api}
														</span>
													))}
												</div>
											</div>
										</NavLink>
									);
								})}
							</nav>
						</div>

						<div className="shrink-0 rounded-[1.8rem] border border-sidebar-border/60 bg-background/58 p-5">
							<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Quick access
							</p>
							<p className="mt-2 text-sm leading-6 text-muted-foreground">
								Jump to demos, docs, and theme actions without leaving the
								current route.
							</p>
							<AppCommandPalette buttonClassName="mt-4 w-full sm:min-w-0" />

							<div className="mt-4 grid gap-3">
								{showcaseStats.map((stat) => {
									const Icon = stat.icon;

									return (
										<div
											key={stat.label}
											className="rounded-[1.3rem] border border-sidebar-border/60 bg-background/60 p-4"
										>
											<div className="flex items-center gap-3">
												<div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
													<Icon className="size-5" />
												</div>
												<div>
													<p className="text-sm font-medium text-sidebar-foreground">
														{stat.value}
													</p>
													<p className="text-xs text-muted-foreground">
														{stat.label}
													</p>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</aside>

				<div className="flex min-w-0 flex-col gap-4 lg:gap-6">
					<header className="relative overflow-hidden rounded-[2.1rem] border border-border/65 bg-background/74 p-5 shadow-xl shadow-black/[0.05] backdrop-blur-xl sm:p-6 lg:p-7 dark:shadow-black/[0.28]">
						<div className="pointer-events-none absolute inset-0">
							<div className="absolute top-0 right-0 h-52 w-52 rounded-full bg-primary/12 blur-3xl" />
							<div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-accent/16 blur-3xl" />
						</div>

						<div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
							<div className="space-y-5">
								<div className="flex items-start gap-4">
									<div className="flex size-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-primary/12 text-primary shadow-sm shadow-black/[0.08]">
										<ActiveIcon className="size-7" />
									</div>
									<div className="min-w-0 space-y-3">
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="secondary">Active route</Badge>
											<Badge variant="outline">{activeLink.releaseArea}</Badge>
											<Badge variant="outline">
												{learningStages[activeLink.stage]}
											</Badge>
											<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
												React 19 + Bun sandbox
											</p>
										</div>

										<div className="space-y-2">
											<h1 className="font-display text-4xl leading-none text-foreground sm:text-5xl">
												{activeLink.label}
											</h1>
											<p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
												{activeLink.blurb} Each route is treated like a focused
												studio module, so the shell stays out of the way and the
												page content can do the teaching.
											</p>
										</div>
									</div>
								</div>

								<div className="flex flex-wrap gap-2">
									{activeLink.apiLabels.map((api) => (
										<Badge
											key={api}
											variant="outline"
											className="rounded-full bg-background/72 px-3 py-1"
										>
											{api}
										</Badge>
									))}
								</div>
							</div>

							<div className="hidden xl:block">
								<div className="app-surface rounded-[1.65rem] p-5">
									<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
										Route lens
									</p>

									<div className="mt-4 grid gap-3">
										<div className="rounded-[1.2rem] border border-border/60 bg-background/65 p-4">
											<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
												Learning stage
											</p>
											<p className="mt-2 font-medium text-foreground">
												{learningStages[activeLink.stage]}
											</p>
										</div>

										<div className="rounded-[1.2rem] border border-border/60 bg-background/65 p-4">
											<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
												Release area
											</p>
											<p className="mt-2 font-medium text-foreground">
												{activeLink.releaseArea}
											</p>
										</div>

										<div className="rounded-[1.2rem] border border-border/60 bg-background/65 p-4">
											<p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
												APIs in focus
											</p>
											<p className="mt-2 text-sm leading-6 text-muted-foreground">
												{activeLink.apiLabels.join(" / ")}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="relative mt-5 space-y-3 lg:hidden">
							<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
								<AppCommandPalette buttonClassName="w-full sm:min-w-0" />
								<ThemeToggle className="justify-self-start sm:justify-self-end" />
							</div>

							<ScrollArea className="w-full whitespace-nowrap">
								<div className="flex gap-2 pb-1">
									{navItems.map((link) => {
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
