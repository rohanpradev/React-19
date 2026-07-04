import { Navigate, NavLink, Outlet, useLoaderData, useLocation, useNavigation } from "react-router";

import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Compass } from "lucide-react";

import { type AuthSession, authClient } from "@/auth/client";
import { buildAuthHref, getDefaultAuthRedirectPath, sanitizeRedirectPath } from "@/auth/redirects";
import { AppCommandPalette } from "@/components/app-command-palette";
import { TechLogo } from "@/components/tech-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UserMenu } from "@/components/user-menu";
import {
	accountNavItem,
	appIdentity,
	learningStages,
	type NavItem,
	navItems,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

import "./index.css";

const routeGroups = Object.entries(learningStages)
	.map(([stage, label]) => ({
		stage,
		label,
		items: navItems.filter((item) => item.stage === stage),
	}))
	.filter(({ items }) => items.length > 0);

export function App() {
	const location = useLocation();
	const { session: authSession } = useLoaderData() as { session: AuthSession | null };
	const liveSession = authClient.useSession();
	const isAuthRoute = location.pathname === "/auth";
	const session = liveSession.isPending ? authSession : liveSession.data;
	const nextPath = sanitizeRedirectPath(
		new URLSearchParams(location.search).get("next") ?? getDefaultAuthRedirectPath(),
	);
	const currentPath = `${location.pathname}${location.search}${location.hash}`;

	if (isAuthRoute) {
		if (session) {
			return <Navigate to={nextPath} replace />;
		}

		return <Outlet />;
	}

	if (!session) {
		return <Navigate to={buildAuthHref(currentPath)} replace />;
	}

	return <WorkspaceLayout session={session} />;
}

function WorkspaceLayout({ session }: { session: AuthSession }) {
	const location = useLocation();
	const navigation = useNavigation();
	const activeLink =
		location.pathname === accountNavItem.path
			? accountNavItem
			: (navItems.find(({ path }) => location.pathname === path) ?? navItems[0]);
	const activeLearningLinkIndex = navItems.findIndex(({ path }) => path === activeLink.path);
	const nextLink =
		activeLearningLinkIndex >= 0
			? (navItems[(activeLearningLinkIndex + 1) % navItems.length] ?? navItems[0])
			: navItems[0];
	const previousLink =
		activeLearningLinkIndex >= 0
			? (navItems[(activeLearningLinkIndex - 1 + navItems.length) % navItems.length] ?? navItems[0])
			: (navItems.at(-1) ?? navItems[0]);
	const ActiveIcon = activeLink.icon;
	const IdentityIcon = appIdentity.icon;
	const isRoutePending = navigation.state !== "idle";

	return (
		<div className="min-h-screen w-full bg-background text-foreground">
			<div
				className={cn(
					"fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary transition-transform duration-300",
					isRoutePending ? "scale-x-100" : "scale-x-0",
				)}
			/>
			<a href="#main-content" className="skip-link">
				Skip to content
			</a>

			<div className="mx-auto grid min-h-screen w-full max-w-[1680px] xl:grid-cols-[92px_minmax(0,1fr)]">
				<aside className="hidden px-4 py-5 xl:block">
					<div className="app-rail sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col items-center p-3">
						<NavLink
							to="/overview"
							className="group/nav relative flex size-[3.25rem] items-center justify-center rounded-lg bg-foreground text-background shadow-lg shadow-black/10"
							aria-label={appIdentity.title}
						>
							<IdentityIcon className="size-6" />
							<span className="rail-tooltip group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100">
								{appIdentity.title}
							</span>
						</NavLink>

						<nav className="mt-8 flex flex-1 flex-col items-center gap-2 overflow-visible">
							{navItems.map((link) => {
								const Icon = link.icon;

								return (
									<NavLink
										key={link.path}
										to={link.path}
										title={link.label}
										aria-label={link.label}
										className={({ isActive }) =>
											cn(
												"group/nav relative flex size-12 items-center justify-center rounded-lg transition-all duration-200",
												isActive
													? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
													: "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
											)
										}
									>
										<Icon className="size-5" />
										<span className="rail-tooltip group-hover/nav:opacity-100 group-focus-visible/nav:opacity-100">
											<span className="block font-medium">{link.label}</span>
											<span className="mt-0.5 block text-[11px] text-muted-foreground">
												{link.releaseArea}
											</span>
										</span>
									</NavLink>
								);
							})}
						</nav>

						<div className="flex flex-col items-center gap-2 border-t border-border/60 pt-4">
							<TechLogo name="react" className="size-5 opacity-80" />
							<TechLogo name="bun" className="size-5 opacity-80" />
							<TechLogo name="shadcn" className="size-5 opacity-80" />
						</div>
					</div>
				</aside>

				<div className="min-w-0 px-3 py-3 sm:px-5 sm:py-5 xl:pr-6 xl:pl-0">
					<header className="app-topbar sticky top-3 z-40 p-2.5 sm:p-3">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div className="hidden min-w-0 items-center gap-3 md:flex">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
									<ActiveIcon className="size-5" />
								</div>
								<div className="min-w-0">
									<div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
										<span>{learningStages[activeLink.stage]}</span>
										<ChevronRight className="size-3.5" />
										<span className="truncate">{activeLink.releaseArea}</span>
									</div>
									<p className="mt-1 truncate font-display text-xl leading-none text-foreground sm:text-2xl">
										{activeLink.label}
									</p>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2 md:justify-end">
								<AppCommandPalette buttonClassName="min-w-0 flex-1 sm:flex-none sm:min-w-[210px]" />
								<ThemeToggle />
								<UserMenu
									session={session}
									showDetails={false}
									className="size-11 rounded-lg px-0"
								/>
								<Button asChild variant="ghost" size="sm" className="hidden px-3 lg:inline-flex">
									<NavLink to={nextLink.path}>
										Next
										<ArrowRight className="size-4" />
									</NavLink>
								</Button>
							</div>
						</div>
					</header>

					<RouteContextPanel
						activeLink={activeLink}
						nextLink={nextLink}
						previousLink={previousLink}
					/>

					<main id="main-content" className="min-w-0 py-4 sm:py-6">
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
}

function RouteContextPanel({
	activeLink,
	nextLink,
	previousLink,
}: {
	activeLink: NavItem;
	nextLink: NavItem;
	previousLink: NavItem;
}) {
	const activePath = activeLink.path;
	const ActiveIcon = activeLink.icon;
	const activeRouteIndex = navItems.findIndex((link) => link.path === activePath);
	const activeRouteNumber = activeRouteIndex >= 0 ? activeRouteIndex + 1 : 0;
	const routePosition =
		activeRouteNumber > 0 ? `${activeRouteNumber}/${navItems.length}` : "Workspace";
	const routeCompletion =
		activeRouteNumber > 0 ? Math.round((activeRouteNumber / navItems.length) * 100) : 0;

	return (
		<section className="pt-3 xl:hidden" aria-label="Route information">
			<div className="app-surface overflow-hidden">
				<div className="border-b border-border/60 bg-muted/20 px-4 py-3">
					<div className="flex items-center justify-between gap-3">
						<div className="flex min-w-0 items-center gap-2">
							<div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
								<Compass className="size-4" />
							</div>
							<div className="min-w-0">
								<p className="truncate text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
									Route intelligence
								</p>
								<p className="truncate text-sm font-medium text-foreground">
									{learningStages[activeLink.stage]} / {activeLink.releaseArea}
								</p>
							</div>
						</div>
						<div className="shrink-0 text-right">
							<p className="text-xs font-medium text-muted-foreground">{routePosition}</p>
							<p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
								Routes
							</p>
						</div>
					</div>
					<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-[width] duration-500"
							style={{ width: `${routeCompletion}%` }}
						/>
					</div>
				</div>

				<div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
					<div className="flex min-w-0 gap-3">
						<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20">
							<ActiveIcon className="size-5" />
						</div>
						<div className="min-w-0">
							<div className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
								<span className="truncate">{learningStages[activeLink.stage]}</span>
								<ChevronRight className="size-3.5 shrink-0" />
								<span className="truncate">{activeLink.releaseArea}</span>
							</div>
							<h2 className="mt-1 font-display text-xl leading-tight text-foreground">
								{activeLink.label}
							</h2>
							<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
								{activeLink.blurb}
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								<Badge variant="secondary">{activeLink.releaseArea}</Badge>
								{activeLink.apiLabels.map((api) => (
									<Badge key={api} variant="outline">
										{api}
									</Badge>
								))}
							</div>
						</div>
					</div>

					<div className="grid gap-3">
						<div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="outline" size="sm" className="h-10 justify-between px-3">
										Browse routes
										<ChevronDown className="size-4" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									align="end"
									className="max-h-[min(24rem,calc(100vh-12rem))] w-[calc(100vw-1.5rem)] max-w-[480px] overflow-y-auto"
								>
									{routeGroups.map((group, groupIndex) => (
										<DropdownMenuGroup key={group.stage}>
											{groupIndex > 0 ? <DropdownMenuSeparator /> : null}
											<DropdownMenuLabel className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
												{group.label}
											</DropdownMenuLabel>
											{group.items.map((link) => {
												const Icon = link.icon;
												const isActive = link.path === activePath;

												return (
													<DropdownMenuItem
														key={link.path}
														asChild
														className={cn("items-start gap-3 py-2.5", isActive && "bg-accent")}
													>
														<NavLink to={link.path}>
															<span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
																<Icon className="size-4" />
															</span>
															<span className="min-w-0 flex-1">
																<span className="block truncate font-medium">{link.label}</span>
																<span className="mt-0.5 block truncate text-xs text-muted-foreground">
																	{link.releaseArea} / {link.apiLabels.slice(0, 2).join(", ")}
																</span>
															</span>
															{isActive ? (
																<Check className="mt-1 ml-auto size-4 shrink-0 text-primary" />
															) : null}
														</NavLink>
													</DropdownMenuItem>
												);
											})}
										</DropdownMenuGroup>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<Button asChild variant="outline" size="icon" className="size-10">
								<NavLink
									to={previousLink.path}
									aria-label={`Previous route: ${previousLink.label}`}
								>
									<ArrowLeft className="size-4" />
								</NavLink>
							</Button>

							<Button asChild size="icon" className="size-10">
								<NavLink to={nextLink.path} aria-label={`Next route: ${nextLink.label}`}>
									<ArrowRight className="size-4" />
								</NavLink>
							</Button>
						</div>

						<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
							<AdjacentRouteCard direction="Previous" link={previousLink} icon={ArrowLeft} />
							<AdjacentRouteCard direction="Next" link={nextLink} icon={ArrowRight} />
						</div>
					</div>
				</div>

				<div className="border-t border-border/60 bg-muted/20 px-4 py-3">
					<div className="mb-3 flex items-center justify-between gap-3">
						<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
							Browse the route map
						</p>
						<span className="text-xs font-medium text-muted-foreground">
							{routeCompletion}% explored
						</span>
					</div>

					<div className="relative min-w-0">
						<ScrollArea className="w-full whitespace-nowrap pb-3">
							<nav aria-label="Route shortcuts" className="flex w-max gap-2 pb-3 pr-6">
								{navItems.map((link, index) => {
									const Icon = link.icon;

									return (
										<NavLink
											key={link.path}
											to={link.path}
											className={({ isActive }) =>
												cn(
													"group inline-grid h-16 min-w-[11rem] shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-lg border px-3 text-left transition-colors",
													isActive
														? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
														: "border-border/70 bg-card/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
												)
											}
										>
											<span className="flex size-9 items-center justify-center rounded-md bg-background/70 text-foreground group-[.active]:bg-primary-foreground/12 group-[.active]:text-primary-foreground">
												<Icon className="size-4" />
											</span>
											<span className="min-w-0">
												<span className="block text-[11px] font-semibold tracking-[0.12em] opacity-70">
													{String(index + 1).padStart(2, "0")}
												</span>
												<span className="block truncate text-sm font-medium">{link.label}</span>
												<span className="block truncate text-[11px] opacity-75">
													{link.releaseArea}
												</span>
											</span>
										</NavLink>
									);
								})}
							</nav>
							<ScrollBar orientation="horizontal" />
						</ScrollArea>
						<div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
					</div>
				</div>
			</div>
		</section>
	);
}

function AdjacentRouteCard({
	direction,
	link,
	icon: Icon,
}: {
	direction: "Previous" | "Next";
	link: NavItem;
	icon: typeof ArrowLeft;
}) {
	const LinkIcon = link.icon;

	return (
		<NavLink
			to={link.path}
			aria-label={`${direction} route: ${link.label}`}
			className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border/70 bg-card/80 p-3 transition-colors hover:bg-muted/70 hover:text-foreground"
		>
			<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground">
				<LinkIcon className="size-4" />
			</span>
			<span className="min-w-0">
				<span className="block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
					{direction}
				</span>
				<span className="block truncate text-sm font-medium text-foreground">{link.label}</span>
				<span className="block truncate text-xs text-muted-foreground">{link.releaseArea}</span>
			</span>
			<Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
		</NavLink>
	);
}

export default App;
