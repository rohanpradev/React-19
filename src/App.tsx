import { ArrowRight, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigation } from "react-router";
import { type AuthSession, authClient } from "@/auth/client";
import { buildAuthHref, getDefaultAuthRedirectPath, sanitizeRedirectPath } from "@/auth/redirects";
import { AppCommandPalette } from "@/components/app-command-palette";
import { TechLogo } from "@/components/tech-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMenu } from "@/components/user-menu";
import { appIdentity, learningStages, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import "./index.css";

export function App() {
	const location = useLocation();
	const { data: authSession, isPending } = authClient.useSession();
	const isAuthRoute = location.pathname === "/auth";
	const nextPath = sanitizeRedirectPath(
		new URLSearchParams(location.search).get("next") ?? getDefaultAuthRedirectPath(),
	);
	const currentPath = `${location.pathname}${location.search}${location.hash}`;

	if (isPending) {
		return <AuthLoadingScreen />;
	}

	if (!authSession && !isAuthRoute) {
		return <Navigate to={buildAuthHref(currentPath)} replace />;
	}

	if (authSession && isAuthRoute) {
		return <Navigate to={nextPath} replace />;
	}

	if (isAuthRoute) {
		return <Outlet />;
	}

	if (!authSession) {
		return <Navigate to={buildAuthHref(currentPath)} replace />;
	}

	return <WorkspaceLayout session={authSession} />;
}

function WorkspaceLayout({ session }: { session: AuthSession }) {
	const location = useLocation();
	const navigation = useNavigation();
	const activeLink = navItems.find(({ path }) => location.pathname === path) ?? navItems[0];
	const activeLinkIndex = navItems.findIndex(({ path }) => path === activeLink.path);
	const nextLink = navItems[(activeLinkIndex + 1) % navItems.length] ?? navItems[0];
	const ActiveIcon = activeLink.icon;
	const IdentityIcon = appIdentity.icon;
	const isRoutePending = navigation.state !== "idle";

	return (
		<div className="min-h-screen w-full text-foreground">
			<div
				className={cn(
					"fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary transition-transform duration-300",
					isRoutePending ? "scale-x-100" : "scale-x-0",
				)}
			/>
			<a href="#main-content" className="skip-link">
				Skip to content
			</a>

			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute top-[-11rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-primary/12 blur-3xl" />
				<div className="absolute bottom-[-14rem] left-[-10rem] h-[32rem] w-[32rem] rounded-full bg-accent/45 blur-3xl" />
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
			</div>

			<div className="mx-auto grid min-h-screen w-full max-w-[1680px] xl:grid-cols-[92px_minmax(0,1fr)]">
				<aside className="hidden px-4 py-5 xl:block">
					<div className="app-rail sticky top-5 flex h-[calc(100vh-2.5rem)] flex-col items-center p-3">
						<NavLink
							to="/overview"
							className="group/nav relative flex size-[3.25rem] items-center justify-center rounded-[1.35rem] bg-foreground text-background shadow-lg shadow-black/10"
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
												"group/nav relative flex size-12 items-center justify-center rounded-[1.15rem] transition-all duration-200",
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
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<div className="flex min-w-0 items-center gap-3">
								<div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
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

							<div className="flex flex-wrap items-center gap-2 lg:justify-end">
								<AppCommandPalette buttonClassName="min-w-0 flex-1 sm:flex-none sm:min-w-[210px]" />
								<ThemeToggle />
								<UserMenu
									session={session}
									showDetails={false}
									className="size-11 rounded-2xl px-0"
								/>
								<Button
									asChild
									variant="ghost"
									size="sm"
									className="hidden rounded-xl px-3 lg:inline-flex"
								>
									<NavLink to={nextLink.path}>
										Next
										<ArrowRight className="size-4" />
									</NavLink>
								</Button>
							</div>
						</div>
					</header>

					<div className="pt-3 xl:hidden">
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
													"inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
													isActive
														? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
														: "border-border/70 bg-card/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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

					<main id="main-content" className="min-w-0 py-4 sm:py-6">
						<Outlet />
					</main>
				</div>
			</div>
		</div>
	);
}

function AuthLoadingScreen() {
	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<SurfaceCard>
				<div className="space-y-3 text-center">
					<Badge variant="secondary">Checking session</Badge>
					<h1 className="font-display text-3xl text-foreground">Loading private workspace</h1>
					<p className="max-w-md text-sm leading-7 text-muted-foreground">
						Better Auth is resolving your current session before the app shell opens.
					</p>
				</div>
			</SurfaceCard>
		</div>
	);
}

function SurfaceCard({ children }: { children: ReactNode }) {
	return <div className="app-panel w-full max-w-xl p-8">{children}</div>;
}

export default App;
