import { createBrowserRouter, Navigate } from "react-router";

import { App } from "@/App";
import { rootLoader } from "@/auth/loader";
import { PageErrorBoundary, RouteErrorBoundary } from "@/components/route-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";

function RouteHydrateFallback() {
	return (
		<div
			aria-label="Loading route"
			role="status"
			className="space-y-3 rounded-lg border border-border/60 bg-muted/35 p-4"
		>
			<Skeleton className="h-6 w-40" />
			<Skeleton className="h-4 w-full max-w-lg" />
			<div className="grid gap-3 sm:grid-cols-3">
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
				<Skeleton className="h-24" />
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
				ErrorBoundary: PageErrorBoundary,
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
						path: "control-room",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { ControlRoomPage } = await import("@/pages/ControlRoom");
							return { Component: ControlRoomPage };
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
						path: "virtual-explorer",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { VirtualExplorerPage } = await import("@/pages/VirtualExplorer");
							return { Component: VirtualExplorerPage };
						},
					},
					{
						path: "workflow-board",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { WorkflowBoardPage } = await import("@/pages/WorkflowBoard");
							return { Component: WorkflowBoardPage };
						},
					},
					{
						path: "intake-form",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { IntakeFormPage } = await import("@/pages/IntakeForm");
							return { Component: IntakeFormPage };
						},
					},
					{
						path: "upload-manager",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { UploadManagerPage } = await import("@/pages/UploadManager");
							return { Component: UploadManagerPage };
						},
					},
					{
						path: "workbench-layout",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { WorkbenchLayoutPage } = await import("@/pages/WorkbenchLayout");
							return { Component: WorkbenchLayoutPage };
						},
					},
					{
						path: "server-state",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { ServerStatePage } = await import("@/pages/ServerState");
							return { Component: ServerStatePage };
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
						path: "access",
						HydrateFallback: RouteHydrateFallback,
						lazy: async () => {
							const { AccessManagementPage } = await import("@/pages/AccessManagement");
							return { Component: AccessManagementPage };
						},
					},
					{
						path: "auth",
						ErrorBoundary: RouteErrorBoundary,
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
		],
	},
]);
