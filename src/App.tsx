import { useState } from "react";
import { Navigate, NavLink, Outlet, useLoaderData, useLocation, useNavigation } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight } from "lucide-react";

import { type AuthSession, authClient } from "@/auth/client";
import type { rootLoader } from "@/auth/loader";
import { buildAuthHref, getDefaultAuthRedirectPath, sanitizeRedirectPath } from "@/auth/redirects";
import { AppCommandPalette } from "@/components/app-command-palette";
import { TechLogo } from "@/components/tech-logo";
import { ThemeToggle } from "@/components/theme-toggle";
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
	const { session: authSession } = useLoaderData<typeof rootLoader>();
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

	return <AuthenticatedWorkspace key={session.session.id} session={session} />;
}

function AuthenticatedWorkspace({ session }: { session: AuthSession }) {
	// A new login owns a new cache, including when another tab changes the session.
	const [queryClient] = useState(
		() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 10_000 } } }),
	);
	return (
		<QueryClientProvider client={queryClient}>
			<WorkspaceLayout session={session} />
		</QueryClientProvider>
	);
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

			<div className="mx-auto grid min-h-screen w-full max-w-[1680px] xl:grid-cols-[248px_minmax(0,1fr)]">
				<aside className="hidden border-r border-sidebar-border/70 bg-sidebar xl:block">
					<div className="sticky top-0 flex h-dvh flex-col p-4">
						<NavLink
							to="/overview"
							className="flex items-center gap-3 rounded-lg px-2 py-3"
							aria-label={appIdentity.title}
						>
							<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
								<IdentityIcon className="size-5" />
							</span>
							<span>
								<span className="block text-sm font-semibold tracking-tight">React Systems</span>
								<span className="block text-xs text-muted-foreground">
									Studio / Learning workspace
								</span>
							</span>
						</NavLink>
						<nav
							aria-label="Learning routes"
							className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain pr-1"
						>
							{routeGroups.map((group) => (
								<div key={group.stage}>
									<p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
										{group.label}
									</p>
									<div className="space-y-1">
										{group.items.map((link) => {
											const Icon = link.icon;
											return (
												<NavLink
													key={link.path}
													to={link.path}
													className={({ isActive }) =>
														cn(
															"group flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors",
															isActive
																? "bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/10"
																: "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
														)
													}
												>
													<Icon aria-hidden="true" className="size-4 shrink-0" />
													<span className="min-w-0 flex-1">{link.label}</span>
													{location.pathname === link.path && (
														<ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
													)}
												</NavLink>
											);
										})}
									</div>
								</div>
							))}
						</nav>
						<div className="mt-4 flex items-center gap-2.5 border-t border-sidebar-border px-2 pt-4">
							<TechLogo name="shadcn" className="size-4 text-muted-foreground" />
							<span className="flex-1 text-xs text-muted-foreground">
								Built to explore. Ready to use.
							</span>
						</div>
					</div>
				</aside>

				<div className="min-w-0 px-3 py-3 sm:px-5 sm:py-5 xl:px-8 xl:py-5">
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
									<p className="mt-1 truncate font-display text-lg font-semibold leading-none text-foreground sm:text-xl">
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

					<main tabIndex={-1} id="main-content" className="min-w-0 py-4 sm:py-6">
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
	const ActiveIcon = activeLink.icon;
	return (
		<nav
			aria-label="Current route and navigation"
			className="app-surface mt-3 flex items-center gap-2 p-3 xl:hidden"
		>
			<ActiveIcon aria-hidden="true" className="size-5 shrink-0 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="text-[11px] text-muted-foreground">{learningStages[activeLink.stage]}</p>
				<p className="truncate text-sm font-semibold">{activeLink.label}</p>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" aria-label="Browse routes">
						Routes <ChevronDown className="size-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="max-h-[min(28rem,70dvh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto"
				>
					{routeGroups.map((group, index) => (
						<DropdownMenuGroup key={group.stage}>
							{index > 0 && <DropdownMenuSeparator />}
							<DropdownMenuLabel>{group.label}</DropdownMenuLabel>
							{group.items.map((link) => {
								const Icon = link.icon;
								return (
									<DropdownMenuItem asChild key={link.path} className="py-3">
										<NavLink to={link.path}>
											<Icon aria-hidden="true" className="size-4" />
											<span className="flex-1">{link.label}</span>
											{link.path === activeLink.path && <Check className="size-4" />}
										</NavLink>
									</DropdownMenuItem>
								);
							})}
						</DropdownMenuGroup>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			<Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
				<NavLink to={previousLink.path} aria-label={`Previous route: ${previousLink.label}`}>
					<ArrowLeft className="size-4" />
				</NavLink>
			</Button>
			<Button asChild variant="ghost" size="icon">
				<NavLink to={nextLink.path} aria-label={`Next route: ${nextLink.label}`}>
					<ArrowRight className="size-4" />
				</NavLink>
			</Button>
		</nav>
	);
}

export default App;
