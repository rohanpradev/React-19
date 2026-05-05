import { createBrowserRouter, Navigate } from "react-router";

import { App } from "@/App";
import { RouteErrorBoundary } from "@/components/route-error-boundary";

export const router = createBrowserRouter([
	{
		path: "/",
		Component: App,
		errorElement: <RouteErrorBoundary />,
		children: [
			{
				index: true,
				element: <Navigate to="/overview" replace />,
			},
			{
				path: "overview",
				lazy: async () => {
					const { OverviewPage } = await import("@/pages/OverviewPage");
					return { Component: OverviewPage };
				},
			},
			{
				path: "react-19",
				element: <Navigate to="/overview" replace />,
			},
			{
				path: "architecture",
				lazy: async () => {
					const { ArchitecturePlaybookPage } = await import("@/pages/ArchitecturePlaybook");
					return { Component: ArchitecturePlaybookPage };
				},
			},
			{
				path: "form-actions",
				lazy: async () => {
					const { FormActionsPage } = await import("@/pages/FormActions");
					return { Component: FormActionsPage };
				},
			},
			{
				path: "actions",
				lazy: async () => {
					const { ActionsPage } = await import("@/pages/Actions");
					return { Component: ActionsPage };
				},
			},
			{
				path: "optimistic",
				lazy: async () => {
					const { UseOptimisticPage } = await import("@/pages/Optimistic");
					return { Component: UseOptimisticPage };
				},
			},
			{
				path: "react-use",
				lazy: async () => {
					const { ReactUsePage } = await import("@/pages/ReactUse");
					return { Component: ReactUsePage };
				},
			},
			{
				path: "dom-interop",
				lazy: async () => {
					const { DomInteropPage } = await import("@/pages/DomInterop");
					return { Component: DomInteropPage };
				},
			},
			{
				path: "search-debounce",
				lazy: async () => {
					const { SearchDebounce } = await import("@/pages/SearchDebounce");
					return { Component: SearchDebounce };
				},
			},
			{
				path: "revenue-ops",
				lazy: async () => {
					const { ServerTablePage } = await import("@/pages/ServerTable");
					return { Component: ServerTablePage };
				},
			},
			{
				path: "auth",
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
