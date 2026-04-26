import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { type AuthSession, authClient } from "@/auth/client";
import { buildAuthHref, getDefaultAuthRedirectPath, sanitizeRedirectPath } from "@/auth/redirects";
import { AppCommandPalette } from "@/components/app-command-palette";
import { TechPill } from "@/components/tech-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserMenu } from "@/components/user-menu";
import { appIdentity, learningStages, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { ActionsPage } from "@/pages/Actions";
import { AuthPage } from "@/pages/Auth";
import { DomInteropPage } from "@/pages/DomInterop";
import { FormActionsPage } from "@/pages/FormActions";
import { UseOptimisticPage } from "@/pages/Optimistic";
import { React19OverviewPage } from "@/pages/React19OverviewPage";
import { ReactUsePage } from "@/pages/ReactUse";
import { SearchDebounce } from "@/pages/SearchDebounce";
import { ServerTablePage } from "@/pages/ServerTable";

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
		return <AuthPage />;
	}

	if (!authSession) {
		return <Navigate to={buildAuthHref(currentPath)} replace />;
	}

	return (
		<Routes>
			<Route element={<WorkspaceLayout session={authSession} />}>
				<Route path="/" element={<Navigate to="/react-19" replace />} />
				<Route path="/react-19" element={<React19OverviewPage />} />
				<Route path="/form-actions" element={<FormActionsPage />} />
				<Route path="/revenue-ops" element={<ServerTablePage />} />
				<Route path="/react-use" element={<ReactUsePage />} />
				<Route path="/dom-interop" element={<DomInteropPage />} />
				<Route path="/search-debounce" element={<SearchDebounce />} />
				<Route path="/actions" element={<ActionsPage />} />
				<Route path="/optimistic" element={<UseOptimisticPage />} />
			</Route>
		</Routes>
	);
}

function WorkspaceLayout({ session }: { session: AuthSession }) {
	const location = useLocation();
	const activeLink = navItems.find(({ path }) => location.pathname === path) ?? navItems[0];
	const activeLinkIndex = navItems.findIndex(({ path }) => path === activeLink.path);
	const nextLink = navItems[(activeLinkIndex + 1) % navItems.length] ?? navItems[0];
	const ActiveIcon = activeLink.icon;
	const IdentityIcon = appIdentity.icon;

	return (
		<div className="min-h-screen w-full">
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute top-0 right-[-8rem] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
				<div className="absolute bottom-[-10rem] left-[-4rem] h-72 w-72 rounded-full bg-accent/18 blur-3xl" />
			</div>

			<div className="mx-auto grid min-h-screen max-w-[1480px] gap-4 p-4 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-6 xl:p-6">
				<aside className="hidden xl:block">
					<div className="app-panel sticky top-6 flex h-[calc(100vh-3rem)] flex-col p-4">
						<div className="border-b border-border/60 px-2 pb-4">
							<div className="flex items-center gap-3">
								<div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
									<IdentityIcon className="size-5" />
								</div>
								<div className="min-w-0">
									<p className="truncate text-sm font-semibold text-foreground">
										{appIdentity.title}
									</p>
									<p className="truncate text-xs text-muted-foreground">{appIdentity.label}</p>
								</div>
							</div>
						</div>

						<nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
							{navItems.map((link) => {
								const Icon = link.icon;

								return (
									<NavLink
										key={link.path}
										to={link.path}
										className={({ isActive }) =>
											cn(
												"flex items-center gap-3 rounded-[1rem] px-3 py-3 transition-colors",
												isActive
													? "bg-primary text-primary-foreground"
													: "text-foreground hover:bg-muted/70",
											)
										}
									>
										<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background/70">
											<Icon className="size-4.5" />
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">{link.label}</p>
											<p className="truncate text-xs text-current/70">{link.releaseArea}</p>
										</div>
									</NavLink>
								);
							})}
						</nav>
					</div>
				</aside>

				<div className="min-w-0 space-y-4 xl:space-y-6">
					<header className="space-y-4">
						<div className="app-panel p-4 sm:p-5">
							<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
								<div className="space-y-4">
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
											{activeLink.releaseArea}
										</span>
										<Badge variant="secondary">{learningStages[activeLink.stage]}</Badge>
									</div>

									<div className="flex items-start gap-4">
										<div className="flex size-12 shrink-0 items-center justify-center rounded-[1rem] bg-primary text-primary-foreground">
											<ActiveIcon className="size-6" />
										</div>
										<div className="min-w-0">
											<h1 className="font-display text-3xl leading-none text-foreground sm:text-4xl">
												{activeLink.label}
											</h1>
											<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
												{activeLink.blurb}
											</p>
										</div>
									</div>

									<div className="flex flex-wrap gap-2">
										<TechPill name="react" />
										<TechPill name="bun" />
										<TechPill name="shadcn" />
										<TechPill name="react-router" />
									</div>
								</div>

								<div className="flex flex-col gap-3 xl:items-end">
									<div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
										<AppCommandPalette buttonClassName="sm:min-w-[220px]" />
										<ThemeToggle />
										<UserMenu session={session} className="justify-between sm:min-w-[220px]" />
									</div>

									<Button asChild variant="ghost" className="px-0 text-sm">
										<NavLink to={nextLink.path}>
											Next: {nextLink.label}
											<ArrowRight className="size-4" />
										</NavLink>
									</Button>
								</div>
							</div>
						</div>

						<div className="xl:hidden">
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
														"inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
														isActive
															? "border-primary bg-primary text-primary-foreground"
															: "border-border/70 bg-background/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
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

					<main className="app-panel min-w-0 p-4 sm:p-6 lg:p-8">
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
