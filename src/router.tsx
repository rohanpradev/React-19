import { createBrowserRouter, Navigate } from "react-router";

import { App } from "@/App";
import { authClient } from "@/auth/client";
import { RouteErrorBoundary } from "@/components/route-error-boundary";

/**
 * Root loader to fetch the session once for the entire app.
 * React Router Data Mode executes this before rendering the route tree.
 */
async function rootLoader() {
	const { data: session } = await authClient.getSession();
	return { session };
}

function RouteHydrateFallback() {
	return (
		<div
			aria-label="Loading route"
			role="status"
			className="space-y-3 rounded-lg border border-border/60 bg-muted/35 p-4"
		>
			<div className="h-6 w-40 animate-pulse rounded-md bg-muted-foreground/15" />
			<div className="h-4 w-full max-w-lg animate-pulse rounded-md bg-muted-foreground/12" />
			<div className="grid gap-3 sm:grid-cols-3">
				<div className="h-24 animate-pulse rounded-lg bg-muted-foreground/10" />
				<div className="h-24 animate-pulse rounded-lg bg-muted-foreground/10" />
				<div className="h-24 animate-pulse rounded-lg bg-muted-foreground/10" />
			</div>
		</div>
	);
}

export const router = createBrowserRouter([
	{
		path: "/",
		id: "root",
		Component: App,
		loader: rootLoader,
		HydrateFallback: RouteHydrateFallback,
		errorElement: <RouteErrorBoundary />,
		children: [
			{
				index: true,
				element: <Navigate to="/overview" replace />,
			},
			{
				path: "overview",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { OverviewPage } = await import("@/pages/OverviewPage");
					return { Component: OverviewPage };
				},
			},
			{
				path: "architecture",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { ArchitecturePlaybookPage } = await import("@/pages/ArchitecturePlaybook");
					return { Component: ArchitecturePlaybookPage };
				},
			},
			{
				path: "platform-readiness",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { PlatformReadinessPage } = await import("@/pages/PlatformReadiness");
					return { Component: PlatformReadinessPage };
				},
			},
			{
				path: "form-actions",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { FormActionsPage } = await import("@/pages/FormActions");
					return { Component: FormActionsPage };
				},
			},
			{
				path: "actions",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { ActionsPage } = await import("@/pages/Actions");
					return { Component: ActionsPage };
				},
			},
			{
				path: "optimistic",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { UseOptimisticPage } = await import("@/pages/Optimistic");
					return { Component: UseOptimisticPage };
				},
			},
			{
				path: "react-use",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { ReactUsePage } = await import("@/pages/ReactUse");
					return { Component: ReactUsePage };
				},
			},
			{
				path: "dom-interop",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { DomInteropPage } = await import("@/pages/DomInterop");
					return { Component: DomInteropPage };
				},
			},
			{
				path: "search-debounce",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { SearchDebounce } = await import("@/pages/SearchDebounce");
					return { Component: SearchDebounce };
				},
			},
			{
				path: "revenue-ops",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { ServerTablePage } = await import("@/pages/ServerTable");
					return { Component: ServerTablePage };
				},
			},
			{
				path: "account",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { AccountPage } = await import("@/pages/Account");
					return { Component: AccountPage };
				},
			},
			{
				path: "auth",
				HydrateFallback: RouteHydrateFallback,
				lazy: async () => {
					const { AuthPage } = await import("@/pages/Auth");
					return { Component: AuthPage };
				},
			},
			{
				path: "*",
				element: <Navigate to="/overview" replace />,
			},
		],
	},
]);
