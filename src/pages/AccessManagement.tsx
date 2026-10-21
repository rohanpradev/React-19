import { useState } from "react";
import { NavLink } from "react-router";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ArrowLeft,
	ArrowRight,
	CheckCircle2,
	History,
	Loader2,
	Minus,
	RefreshCw,
	ShieldAlert,
	ShieldCheck,
} from "lucide-react";

import { authClient } from "@/auth/client";
import {
	type AppPermission,
	type AppRole,
	hasPermission,
	isAppRole,
	permissions,
	roleNames,
} from "@/auth/permissions";
import { FeatureIntro } from "@/components/feature-intro";
import { RoleBadge, roleLabel } from "@/components/role-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type {
	AccessAuditEntry,
	AccessResponse,
	AccessUser,
	UpdateUserRoleRequest,
	UpdateUserRoleResponse,
} from "@/lib/access";
import { ApiError, requestJson } from "@/lib/api-client";

const accessQueryKey = ["workspace-access"] as const;
const pageSize = 25;
const auditPageSize = 20;
const roleDescriptions: Record<AppRole, string> = {
	viewer: "Read customer data and platform signals.",
	editor: "Read data and update platform signal status.",
	admin: "Edit signals, assign roles, and review access history.",
};
const permissionRows: { label: string; permission: AppPermission }[] = [
	{ label: "Read customer data", permission: permissions.customersRead },
	{ label: "Read platform signals", permission: permissions.signalsRead },
	{ label: "Update platform signals", permission: permissions.signalsWrite },
	{ label: "Review users and access history", permission: permissions.accessRead },
	{ label: "Assign workspace roles", permission: permissions.accessManage },
];

export function AccessManagementPage() {
	const { data: session, isPending } = authClient.useSession();
	if (isPending && !session) return <AccessSkeleton />;
	if (!hasPermission(session?.user.role, permissions.accessRead)) return <AccessDenied />;

	return <AccessManager currentUserId={session?.user.id ?? ""} />;
}

function AccessManager({ currentUserId }: { currentUserId: string }) {
	const [page, setPage] = useState(1);
	const [auditPage, setAuditPage] = useState(1);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const queryClient = useQueryClient();
	const accessQuery = useQuery({
		queryKey: [...accessQueryKey, { page, auditPage }],
		queryFn: ({ signal }) =>
			requestJson<AccessResponse>(
				`/api/access?page=${page}&limit=${pageSize}&auditPage=${auditPage}&auditLimit=${auditPageSize}`,
				{ signal },
			),
	});
	const mutation = useMutation({
		mutationFn: (command: UpdateUserRoleRequest) =>
			requestJson<UpdateUserRoleResponse>("/api/access/roles", {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(command),
			}),
		onMutate: () => setSuccessMessage(null),
		onSuccess: async ({ user }) => {
			setSuccessMessage(
				`${user.name || user.email} now has the ${roleLabel(user.role).toLowerCase()} role. Their existing sessions were signed out.`,
			);
			// Keep the server-confirmed role even if the following audit refresh fails.
			queryClient.setQueriesData<AccessResponse>({ queryKey: accessQueryKey }, (previous) =>
				previous
					? {
							...previous,
							users: previous.users.map((person) => (person.id === user.id ? user : person)),
						}
					: previous,
			);
			await queryClient.invalidateQueries({ queryKey: accessQueryKey });
		},
		onError: async (error) => {
			if (error instanceof ApiError && error.status === 409) {
				await queryClient.invalidateQueries({ queryKey: accessQueryKey });
			}
		},
	});
	const data = accessQuery.data;
	const isBusy = mutation.isPending || accessQuery.isFetching;
	const requiresSignIn =
		mutation.error instanceof ApiError && mutation.error.code === "reauthentication_required";

	if (isForbidden(accessQuery.error) || isForbidden(mutation.error)) return <AccessDenied />;

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Workspace administration"
				title="Access Management"
				summary="Give each person the access their work requires. Review a role change before saving; the affected person will sign in again with their updated permissions."
				points={[
					{
						title: "Least access by default",
						detail:
							"Every new account starts as a viewer. Signing up never grants administrator access.",
					},
					{
						title: "Reviewed changes",
						detail:
							"Only administrators can assign roles. Another administrator must change your own role.",
					},
					{
						title: "Recorded access history",
						detail: "Role changes record who acted, who changed, the previous role, and the time.",
					},
				]}
				links={[
					{
						label: "Better Auth access control",
						href: "https://www.better-auth.com/docs/plugins/admin#access-control",
					},
					{
						label: "Better Auth sessions",
						href: "https://www.better-auth.com/docs/concepts/session-management",
					},
				]}
			/>

			<RoleMatrix />

			{successMessage ? (
				<Alert variant="success" role="status">
					<CheckCircle2 />
					<div>
						<AlertTitle>Role updated</AlertTitle>
						<AlertDescription>{successMessage}</AlertDescription>
					</div>
				</Alert>
			) : null}
			{mutation.error ? (
				<Alert variant="destructive">
					<ShieldAlert />
					<div className="space-y-2">
						<AlertTitle>
							{requiresSignIn ? "Sign in again to change access" : "Role change was not saved"}
						</AlertTitle>
						<AlertDescription>
							<p>{mutation.error.message}</p>
							{requiresSignIn ? (
								<NavLink to="/account" className="font-medium underline underline-offset-4">
									Open your account, then use the account menu to sign out
								</NavLink>
							) : (
								<p>Review the current role and try again when ready.</p>
							)}
						</AlertDescription>
					</div>
				</Alert>
			) : null}

			<Card className="border-border/60">
				<CardHeader>
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<CardTitle>People and roles</CardTitle>
							<CardDescription className="mt-2 max-w-2xl">
								Choose a role, review it, and select Save. Access changes require a sign-in within
								the last 10 minutes.
							</CardDescription>
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => void accessQuery.refetch()}
							disabled={isBusy}
						>
							<RefreshCw className={accessQuery.isFetching ? "size-4 animate-spin" : "size-4"} />
							Refresh
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4" aria-busy={accessQuery.isFetching}>
					{accessQuery.error ? <LoadError message={accessQuery.error.message} /> : null}
					{accessQuery.isLoading ? <PeopleSkeleton /> : null}
					{data ? (
						<>
							{data.users.length === 0 ? (
								<p className="app-muted-surface p-5 text-sm text-muted-foreground">
									No accounts were found on this page.
								</p>
							) : (
								<div className="space-y-3">
									{data.users.map((user) => (
										<PersonRoleRow
											key={`${user.id}:${user.role}`}
											user={user}
											isCurrentUser={user.id === currentUserId || user.id === data.currentUserId}
											disabled={isBusy || accessQuery.isError}
											isSaving={mutation.isPending && mutation.variables?.userId === user.id}
											onSave={(role) =>
												mutation.mutate({ userId: user.id, role, expectedRole: user.role })
											}
										/>
									))}
								</div>
							)}
							<Pagination
								label="People"
								page={data.page}
								limit={data.limit}
								total={data.total}
								disabled={isBusy}
								onPageChange={setPage}
							/>
						</>
					) : null}
				</CardContent>
			</Card>

			<Card className="border-border/60">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<History className="size-5 text-primary" />
						Access history
					</CardTitle>
					<CardDescription>
						Successful role changes and the initial administrator assignment, newest first.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4" aria-busy={accessQuery.isFetching}>
					{accessQuery.isLoading ? <PeopleSkeleton /> : null}
					{data ? (
						<>
							{data.audit.length > 0 ? (
								<ol className="space-y-3" aria-label="Role change history">
									{data.audit.map((entry) => (
										<AuditRow key={entry.id} entry={entry} users={data.users} />
									))}
								</ol>
							) : (
								<p className="app-muted-surface p-5 text-sm text-muted-foreground">
									No access changes have been recorded yet.
								</p>
							)}
							<Pagination
								label="Access history"
								page={data.auditPage}
								limit={data.auditLimit}
								total={data.auditTotal}
								disabled={isBusy}
								onPageChange={setAuditPage}
							/>
						</>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

function PersonRoleRow({
	user,
	isCurrentUser,
	disabled,
	isSaving,
	onSave,
}: {
	user: AccessUser;
	isCurrentUser: boolean;
	disabled: boolean;
	isSaving: boolean;
	onSave: (role: AppRole) => void;
}) {
	const [selectedRole, setSelectedRole] = useState<AppRole>(user.role);
	const isChanged = selectedRole !== user.role;
	return (
		<div className="app-surface grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)_90px] lg:items-center">
			<div className="min-w-0 space-y-1">
				<div className="flex flex-wrap items-center gap-2">
					<p className="break-words font-semibold">{user.name || "Unnamed account"}</p>
					<RoleBadge role={user.role} />
					{isCurrentUser ? <Badge variant="outline">You</Badge> : null}
				</div>
				<p className="break-all text-sm text-muted-foreground">{user.email}</p>
				<code className="block select-all break-all text-xs text-muted-foreground">{user.id}</code>
			</div>
			<div className="space-y-2">
				<Select
					value={selectedRole}
					disabled={disabled || isCurrentUser}
					onValueChange={(role) => {
						if (isAppRole(role)) setSelectedRole(role);
					}}
				>
					<SelectTrigger
						className="w-full"
						aria-label={`Role for ${user.email}`}
						aria-describedby={`role-note-${user.id}`}
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{roleNames.map((role) => (
							<SelectItem key={role} value={role}>
								{roleLabel(role)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p id={`role-note-${user.id}`} className="text-xs leading-5 text-muted-foreground">
					{isCurrentUser
						? "Another administrator must change your role."
						: roleDescriptions[selectedRole]}
				</p>
			</div>
			<Button
				type="button"
				variant={isChanged ? "default" : "outline"}
				disabled={disabled || isCurrentUser || !isChanged}
				onClick={() => onSave(selectedRole)}
				aria-label={`Save role for ${user.email}`}
			>
				{isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
				{isSaving ? "Saving" : "Save"}
			</Button>
		</div>
	);
}

function RoleMatrix() {
	return (
		<Card className="border-border/60">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<ShieldCheck className="size-5 text-primary" />
					What each role can do
				</CardTitle>
				<CardDescription>
					Roles apply to this workspace. Every data request is checked on the server.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Table className="min-w-[500px]">
					<TableCaption>
						All signed-in users can manage their own profile, password, and sessions.
					</TableCaption>
					<TableHeader>
						<TableRow>
							<TableHead scope="col">Permission</TableHead>
							{roleNames.map((role) => (
								<TableHead key={role} scope="col" className="text-center">
									{roleLabel(role)}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{permissionRows.map(({ label, permission }) => (
							<TableRow key={label}>
								<TableHead scope="row" className="font-normal">
									{label}
								</TableHead>
								{roleNames.map((role) => (
									<TableCell key={role} className="text-center">
										{hasPermission(role, permission) ? (
											<>
												<CheckCircle2 className="mx-auto size-4 text-success" aria-hidden="true" />
												<span className="sr-only">Allowed</span>
											</>
										) : (
											<>
												<Minus
													className="mx-auto size-4 text-muted-foreground"
													aria-hidden="true"
												/>
												<span className="sr-only">Not allowed</span>
											</>
										)}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}

function AuditRow({ entry, users }: { entry: AccessAuditEntry; users: AccessUser[] }) {
	return (
		<li className="app-muted-surface space-y-3 p-4">
			<div className="flex flex-wrap items-center gap-2 text-sm">
				<Badge variant="outline">
					{entry.source === "bootstrap" ? "Initial administrator" : "Role changed"}
				</Badge>
				<span>{entry.previousRole ? roleLabel(entry.previousRole) : "Unassigned"}</span>
				<ArrowRight className="size-3.5 text-muted-foreground" aria-hidden="true" />
				<RoleBadge role={entry.nextRole} />
				<time dateTime={entry.createdAt} className="text-xs text-muted-foreground sm:ml-auto">
					{formatDate(entry.createdAt)}
				</time>
			</div>
			<div className="grid gap-3 text-xs sm:grid-cols-2">
				<AccountReference label="Changed by" id={entry.actorId} users={users} />
				<AccountReference label="Account" id={entry.targetId} users={users} />
			</div>
		</li>
	);
}

function AccountReference({
	label,
	id,
	users,
}: {
	label: string;
	id: string;
	users: AccessUser[];
}) {
	const user = users.find((candidate) => candidate.id === id);
	return (
		<div className="min-w-0">
			<p className="font-medium">{label}</p>
			<p className="mt-1 break-all text-muted-foreground">
				{id === "local-bootstrap"
					? "Local workspace operator"
					: user
						? `${user.name || "Account"} · ${user.email}`
						: "Account ID"}
			</p>
			<code className="block select-all break-all text-muted-foreground">{id}</code>
		</div>
	);
}

function Pagination({
	label,
	page,
	limit,
	total,
	disabled,
	onPageChange,
}: {
	label: string;
	page: number;
	limit: number;
	total: number;
	disabled: boolean;
	onPageChange: (page: number) => void;
}) {
	const pages = Math.max(1, Math.ceil(total / limit));
	return (
		<nav
			className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4"
			aria-label={`${label} pagination`}
		>
			<p className="text-xs text-muted-foreground">
				{total} {label.toLowerCase()} · Page {page} of {pages}
			</p>
			<div className="flex items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled || page <= 1}
					onClick={() => onPageChange(page - 1)}
					aria-label={`Previous ${label.toLowerCase()} page`}
				>
					<ArrowLeft className="size-4" />
					Previous
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled || page >= pages}
					onClick={() => onPageChange(page + 1)}
					aria-label={`Next ${label.toLowerCase()} page`}
				>
					Next
					<ArrowRight className="size-4" />
				</Button>
			</div>
		</nav>
	);
}

function AccessDenied() {
	return (
		<div className="space-y-5">
			<h1 className="font-display text-3xl font-semibold">Access Management</h1>
			<Alert variant="info">
				<ShieldAlert />
				<div className="space-y-1">
					<AlertTitle>Administrator access required</AlertTitle>
					<AlertDescription>
						Your current role cannot manage workspace access. Contact an administrator if your
						responsibilities require a different role.
					</AlertDescription>
				</div>
			</Alert>
			<Button asChild variant="outline">
				<NavLink to="/account">View your account and role</NavLink>
			</Button>
		</div>
	);
}

function AccessSkeleton() {
	return (
		<div role="status" aria-label="Checking access" className="space-y-4">
			<Skeleton className="h-9 w-64" />
			<Skeleton className="h-32 w-full" />
		</div>
	);
}

function PeopleSkeleton() {
	return (
		<div role="status" aria-label="Loading workspace access" className="space-y-3">
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-24 w-full" />
			<Skeleton className="h-24 w-full" />
		</div>
	);
}

function LoadError({ message }: { message: string }) {
	return (
		<Alert variant="destructive">
			<ShieldAlert />
			<div>
				<AlertTitle>Unable to load workspace access</AlertTitle>
				<AlertDescription>{message} Select Refresh to try again.</AlertDescription>
			</div>
		</Alert>
	);
}

function isForbidden(error: unknown) {
	return (
		error instanceof ApiError && error.status === 403 && error.code !== "reauthentication_required"
	);
}

function formatDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? "Unknown time"
		: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
