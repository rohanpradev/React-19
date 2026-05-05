import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigation } from "react-router";
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
	const navGroups = (Object.keys(learningStages) as Array<keyof typeof learningStages>)
		.map((stage) => ({
			stage,
			label: learningStages[stage],
			items: navItems.filter((item) => item.stage === stage),
		}))
		.filter((group) => group.items.length > 0);

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
				<div className="absolute top-[-9rem] right-[-8rem] h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
				<div className="absolute bottom-[-12rem] left-[-8rem] h-96 w-96 rounded-full bg-accent/35 blur-3xl" />
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
			</div>

			<div className="mx-auto grid min-h-screen max-w-[1500px] gap-5 p-3 sm:p-5 xl:grid-cols-[286px_minmax(0,1fr)] xl:p-6">
				<aside className="hidden xl:block">
					<div className="app-panel sticky top-6 flex h-[calc(100vh-3rem)] flex-col p-4">
						<div className="px-2 pb-5">
							<div className="flex items-center gap-3">
								<div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/20">
									<IdentityIcon className="size-5" />
								</div>
								<div className="min-w-0">
									<p className="truncate font-display text-base leading-none text-foreground">
										{appIdentity.title}
									</p>
									<p className="mt-1 truncate text-xs text-muted-foreground">{appIdentity.label}</p>
								</div>
							</div>
						</div>

						<nav className="flex-1 space-y-5 overflow-y-auto border-t border-border/70 pt-4">
							{navGroups.map((group) => (
								<div key={group.stage} className="space-y-1.5">
									<p className="px-3 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
										{group.label}
									</p>
									{group.items.map((link) => {
										const Icon = link.icon;

										return (
											<NavLink
												key={link.path}
												to={link.path}
												className={({ isActive }) =>
													cn(
														"group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
														isActive
															? "bg-foreground text-background shadow-sm"
															: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
													)
												}
											>
												<div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background/80 text-current ring-1 ring-border/60 group-[.active]:bg-background/12">
													<Icon className="size-4" />
												</div>
												<div className="min-w-0">
													<p className="truncate font-medium">{link.label}</p>
													<p className="truncate text-[11px] text-current/62">{link.releaseArea}</p>
												</div>
											</NavLink>
										);
									})}
								</div>
							))}
						</nav>

						<div className="mt-4 border-t border-border/70 pt-4">
							<div className="flex flex-wrap gap-2">
								<TechPill name="react" />
								<TechPill name="bun" />
								<TechPill name="shadcn" />
							</div>
						</div>
					</div>
				</aside>

				<div className="min-w-0 space-y-4 xl:space-y-6">
					<header className="space-y-3">
						<div className="app-panel p-4 sm:p-5">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="flex min-w-0 items-start gap-3">
									<div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
										<ActiveIcon className="size-5" />
									</div>
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="secondary">{activeLink.releaseArea}</Badge>
											<span className="text-xs text-muted-foreground">
												{learningStages[activeLink.stage]}
											</span>
										</div>
										<h1 className="mt-2 font-display text-2xl leading-none text-foreground sm:text-3xl">
											{activeLink.label}
										</h1>
										<p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
											{activeLink.blurb}
										</p>
									</div>
								</div>

								<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
									<AppCommandPalette buttonClassName="sm:min-w-[220px]" />
									<ThemeToggle />
									<UserMenu session={session} className="justify-between sm:min-w-[220px]" />
									<Button
										asChild
										variant="ghost"
										className="justify-start px-2 text-sm sm:justify-center"
									>
										<NavLink to={nextLink.path}>
											Next
											<span className="max-w-32 truncate">{nextLink.label}</span>
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

					<main id="main-content" className="min-w-0 pb-8">
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
