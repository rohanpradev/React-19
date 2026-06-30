import { useActionState, useCallback, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
	CalendarClock,
	CheckCircle2,
	CircleAlert,
	KeyRound,
	Loader2,
	MonitorSmartphone,
	RefreshCw,
	ShieldCheck,
	UserRound,
} from "lucide-react";

import { type AuthSession, authClient } from "@/auth/client";
import { FeatureIntro } from "@/components/feature-intro";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { officialDocLinks } from "@/lib/official-docs";
import { cn } from "@/lib/utils";

type AccountActionState = {
	status: "idle" | "success" | "error";
	message: string;
};

type AccountSession = AuthSession["session"];

type SessionListState = {
	status: "idle" | "loading" | "success" | "error";
	message: string;
	sessions: AccountSession[];
};

type AuthErrorLike = {
	code?: string;
	message?: string;
	status?: number;
	statusText?: string;
};

const initialActionState: AccountActionState = {
	status: "idle",
	message: "",
};

const emptySessionListState: SessionListState = {
	status: "idle",
	message: "",
	sessions: [],
};

const accountDocsLinks = officialDocLinks.filter((doc) =>
	[
		"useActionState",
		"Better Auth client",
		"Better Auth user accounts",
		"Better Auth sessions",
	].includes(doc.label),
);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: "medium",
	timeStyle: "short",
});

export function AccountPage() {
	const sessionState = authClient.useSession();
	const session = sessionState.data;
	const refetchFreshSession = useCallback(
		() => sessionState.refetch({ query: { disableCookieCache: true } }),
		[sessionState],
	);

	return (
		<div className="space-y-6">
			<FeatureIntro
				eyebrow="Private workspace"
				title="Account Center"
				summary="Manage the signed-in user, rotate credentials, and inspect active sessions with React Actions and Better Auth client APIs."
				points={[
					{
						title: "Profile updates",
						detail: "Display name and avatar metadata are updated through Better Auth.",
					},
					{
						title: "Password rotation",
						detail: "Password changes can revoke other sessions after the credential update.",
					},
					{
						title: "Session hygiene",
						detail: "Active sessions can be refreshed, inspected, and revoked from one route.",
					},
				]}
				links={accountDocsLinks}
			/>

			{sessionState.error ? (
				<Alert variant="destructive">
					<CircleAlert />
					<div className="space-y-1">
						<AlertTitle>Session refresh failed</AlertTitle>
						<AlertDescription>
							{sessionState.error.message || "Unable to read the current account session."}
						</AlertDescription>
					</div>
				</Alert>
			) : null}

			{sessionState.isPending && !session ? (
				<AccountSkeleton />
			) : session ? (
				<div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
					<div className="space-y-6">
						<AccountSummary session={session} isRefetching={sessionState.isRefetching} />
						<ProfileForm session={session} onSessionRefresh={refetchFreshSession} />
						<PasswordForm onSessionRefresh={refetchFreshSession} />
					</div>

					<SessionPanel currentSession={session.session} onSessionRefresh={refetchFreshSession} />
				</div>
			) : (
				<Alert variant="destructive">
					<CircleAlert />
					<div className="space-y-1">
						<AlertTitle>No active session</AlertTitle>
						<AlertDescription>
							Sign in again before changing account settings or revoking sessions.
						</AlertDescription>
					</div>
				</Alert>
			)}
		</div>
	);
}

function AccountSummary({
	session,
	isRefetching,
}: {
	session: AuthSession;
	isRefetching: boolean;
}) {
	const expiresAt = formatDate(session.session.expiresAt);
	const createdAt = formatDate(session.user.createdAt);
	const sessionStartedAt = formatDate(session.session.createdAt);
	const initials = getInitials(session.user.name, session.user.email);

	return (
		<Card className="border-border/60">
			<CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex min-w-0 items-center gap-4">
					<div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-base font-semibold text-primary">
						{initials}
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<CardTitle className="truncate">{session.user.name}</CardTitle>
							<Badge variant={session.user.emailVerified ? "secondary" : "outline"}>
								{session.user.emailVerified ? "Verified email" : "Email unverified"}
							</Badge>
						</div>
						<CardDescription className="mt-1 truncate">{session.user.email}</CardDescription>
					</div>
				</div>
				<Badge variant="outline">
					{isRefetching ? <Loader2 className="size-3 animate-spin" /> : <ShieldCheck />}
					Live session
				</Badge>
			</CardHeader>
			<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<AccountMetric icon={CalendarClock} label="Account created" value={createdAt} />
				<AccountMetric icon={ShieldCheck} label="Session started" value={sessionStartedAt} />
				<AccountMetric icon={ShieldCheck} label="Session expires" value={expiresAt} />
				<AccountMetric
					icon={MonitorSmartphone}
					label="Current device"
					value={
						session.session.userAgent ? summarizeUserAgent(session.session.userAgent) : "Unknown"
					}
				/>
			</CardContent>
		</Card>
	);
}

function ProfileForm({
	session,
	onSessionRefresh,
}: {
	session: AuthSession;
	onSessionRefresh: () => Promise<void>;
}) {
	const [state, submitAction] = useActionState(
		async (_previousState: AccountActionState, formData: FormData) => {
			const name = readFormValue(formData, "name");
			const image = readFormValue(formData, "image");

			if (name.length < 2) {
				return {
					status: "error",
					message: "Use at least two characters for the display name.",
				} satisfies AccountActionState;
			}

			const result = await authClient.updateUser({
				name,
				image: image || null,
			});

			if (result.error) {
				return {
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to update the profile."),
				} satisfies AccountActionState;
			}

			await onSessionRefresh();

			return {
				status: "success",
				message: "Profile details were updated.",
			} satisfies AccountActionState;
		},
		initialActionState,
	);

	return (
		<Card className="border-border/60">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Better Auth</Badge>
							<Badge variant="outline">updateUser</Badge>
						</div>
						<CardTitle className="mt-3">Profile details</CardTitle>
						<CardDescription>Update user-owned metadata for the current account.</CardDescription>
					</div>
					<span className="hidden size-11 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
						<UserRound className="size-5" />
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<form action={submitAction} className="space-y-5">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="account-name">Display name</Label>
							<Input
								id="account-name"
								name="name"
								defaultValue={session.user.name}
								autoComplete="name"
								required
								minLength={2}
								placeholder="Your name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="account-image">Avatar URL</Label>
							<Input
								id="account-image"
								name="image"
								type="url"
								defaultValue={session.user.image ?? ""}
								placeholder="https://example.com/avatar.png"
							/>
						</div>
					</div>

					<ActionFeedback
						state={state}
						successTitle="Profile updated"
						errorTitle="Profile update failed"
					/>
					<FormSubmitButton idleLabel="Save profile" pendingLabel="Saving profile..." />
				</form>
			</CardContent>
		</Card>
	);
}

function PasswordForm({ onSessionRefresh }: { onSessionRefresh: () => Promise<void> }) {
	const [state, submitAction] = useActionState(
		async (_previousState: AccountActionState, formData: FormData) => {
			const currentPassword = readFormValue(formData, "currentPassword");
			const newPassword = readFormValue(formData, "newPassword");
			const confirmPassword = readFormValue(formData, "confirmPassword");
			const revokeOtherSessions = formData.get("revokeOtherSessions") === "on";

			if (newPassword.length < 10) {
				return {
					status: "error",
					message: "Use at least 10 characters for the new password.",
				} satisfies AccountActionState;
			}

			if (newPassword !== confirmPassword) {
				return {
					status: "error",
					message: "The new password and confirmation do not match.",
				} satisfies AccountActionState;
			}

			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions,
			});

			if (result.error) {
				return {
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to change the password."),
				} satisfies AccountActionState;
			}

			await onSessionRefresh();

			return {
				status: "success",
				message: revokeOtherSessions
					? "Password changed and other sessions were revoked."
					: "Password changed.",
			} satisfies AccountActionState;
		},
		initialActionState,
	);

	return (
		<Card className="border-border/60">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Sensitive action</Badge>
							<Badge variant="outline">changePassword</Badge>
						</div>
						<CardTitle className="mt-3">Password rotation</CardTitle>
						<CardDescription>
							Update the credential account and optionally invalidate other devices.
						</CardDescription>
					</div>
					<span className="hidden size-11 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
						<KeyRound className="size-5" />
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<form action={submitAction} className="space-y-5">
					<div className="grid gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="current-password">Current password</Label>
							<Input
								id="current-password"
								name="currentPassword"
								type="password"
								autoComplete="current-password"
								required
								placeholder="Current password"
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between gap-3">
								<Label htmlFor="new-password">New password</Label>
								<span className="text-xs text-muted-foreground">10+ characters</span>
							</div>
							<Input
								id="new-password"
								name="newPassword"
								type="password"
								autoComplete="new-password"
								required
								minLength={10}
								placeholder="New password"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm password</Label>
							<Input
								id="confirm-password"
								name="confirmPassword"
								type="password"
								autoComplete="new-password"
								required
								minLength={10}
								placeholder="Repeat password"
							/>
						</div>
					</div>

					<label
						htmlFor="revoke-other-sessions"
						className="flex items-start gap-3 rounded-lg border border-border/65 bg-muted/35 p-4 text-sm"
					>
						<input
							id="revoke-other-sessions"
							name="revokeOtherSessions"
							type="checkbox"
							defaultChecked
							className="mt-1 size-4 accent-primary"
						/>
						<span className="space-y-1">
							<span className="block font-medium text-foreground">Revoke other sessions</span>
							<span className="block leading-6 text-muted-foreground">
								Keep this browser signed in while invalidating other active sessions after the
								password update.
							</span>
						</span>
					</label>

					<ActionFeedback
						state={state}
						successTitle="Password changed"
						errorTitle="Password change failed"
					/>
					<FormSubmitButton idleLabel="Change password" pendingLabel="Changing password..." />
				</form>
			</CardContent>
		</Card>
	);
}

function SessionPanel({
	currentSession,
	onSessionRefresh,
}: {
	currentSession: AccountSession;
	onSessionRefresh: () => Promise<void>;
}) {
	const [sessionList, setSessionList] = useState<SessionListState>(emptySessionListState);
	const [revokingToken, setRevokingToken] = useState<string | null>(null);
	const [isRevokingOtherSessions, setIsRevokingOtherSessions] = useState(false);
	const currentToken = currentSession.token;
	const otherSessionCount = useMemo(
		() => sessionList.sessions.filter((session) => session.token !== currentToken).length,
		[sessionList.sessions, currentToken],
	);

	const loadSessions = useCallback(async () => {
		setSessionList((current) => ({ ...current, status: "loading", message: "" }));

		try {
			const result = await authClient.listSessions();

			if (result.error) {
				setSessionList({
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to load active sessions."),
					sessions: [],
				});
				return;
			}

			setSessionList({
				status: "success",
				message: "Active sessions refreshed.",
				sessions: result.data ?? [],
			});
		} catch (error) {
			setSessionList({
				status: "error",
				message: error instanceof Error ? error.message : "Unable to load active sessions.",
				sessions: [],
			});
		}
	}, []);

	useEffect(() => {
		void loadSessions();
	}, [loadSessions]);

	async function revokeSession(token: string) {
		setRevokingToken(token);

		try {
			const result = await authClient.revokeSession({ token });

			if (result.error) {
				setSessionList((current) => ({
					...current,
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to revoke that session."),
				}));
				return;
			}

			await loadSessions();
		} catch (error) {
			setSessionList((current) => ({
				...current,
				status: "error",
				message: error instanceof Error ? error.message : "Unable to revoke that session.",
			}));
		} finally {
			setRevokingToken(null);
		}
	}

	async function revokeOtherSessions() {
		setIsRevokingOtherSessions(true);

		try {
			const result = await authClient.revokeOtherSessions();

			if (result.error) {
				setSessionList((current) => ({
					...current,
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to revoke other sessions."),
				}));
				return;
			}

			await onSessionRefresh();
			await loadSessions();
		} catch (error) {
			setSessionList((current) => ({
				...current,
				status: "error",
				message: error instanceof Error ? error.message : "Unable to revoke other sessions.",
			}));
		} finally {
			setIsRevokingOtherSessions(false);
		}
	}

	return (
		<Card className="border-border/60 xl:sticky xl:top-28">
			<CardHeader>
				<div className="flex items-start justify-between gap-3">
					<div>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Session management</Badge>
							<Badge variant="outline">{sessionList.sessions.length || 0} active</Badge>
						</div>
						<CardTitle className="mt-3">Active sessions</CardTitle>
						<CardDescription>
							Refresh or revoke Better Auth sessions for this account.
						</CardDescription>
					</div>
					<span className="hidden size-11 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
						<MonitorSmartphone className="size-5" />
					</span>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void loadSessions()}
						disabled={sessionList.status === "loading"}
					>
						{sessionList.status === "loading" ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<RefreshCw className="size-4" />
						)}
						Refresh
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void revokeOtherSessions()}
						disabled={isRevokingOtherSessions || otherSessionCount === 0}
					>
						{isRevokingOtherSessions ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<ShieldCheck />
						)}
						Revoke others
					</Button>
				</div>

				{sessionList.status === "error" ? (
					<Alert variant="destructive">
						<CircleAlert />
						<div className="space-y-1">
							<AlertTitle>Session action failed</AlertTitle>
							<AlertDescription>{sessionList.message}</AlertDescription>
						</div>
					</Alert>
				) : null}

				<div className="space-y-3">
					{sessionList.status === "loading" && sessionList.sessions.length === 0 ? (
						<SessionListSkeleton />
					) : sessionList.sessions.length > 0 ? (
						sessionList.sessions.map((session) => {
							const isCurrent = session.token === currentToken;
							const isRevoking = revokingToken === session.token;

							return (
								<div
									key={session.id}
									className={cn(
										"rounded-lg border p-4",
										isCurrent ? "border-primary/25 bg-primary/8" : "border-border/65 bg-muted/35",
									)}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="flex flex-wrap items-center gap-2">
												<p className="font-medium text-foreground">
													{session.userAgent
														? summarizeUserAgent(session.userAgent)
														: "Unknown device"}
												</p>
												{isCurrent ? <Badge variant="secondary">Current</Badge> : null}
											</div>
											<p className="mt-1 text-xs leading-5 text-muted-foreground">
												{session.ipAddress || "No IP address captured"}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => void revokeSession(session.token)}
											disabled={isCurrent || isRevoking || revokingToken !== null}
										>
											{isRevoking ? <Loader2 className="size-4 animate-spin" /> : null}
											Revoke
										</Button>
									</div>

									<div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
										<p>
											<span className="font-medium text-foreground">Created:</span>{" "}
											{formatDate(session.createdAt)}
										</p>
										<p>
											<span className="font-medium text-foreground">Expires:</span>{" "}
											{formatDate(session.expiresAt)}
										</p>
									</div>
								</div>
							);
						})
					) : (
						<div className="app-muted-surface p-4 text-sm leading-6 text-muted-foreground">
							No active sessions were returned for this account.
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function AccountMetric({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof CalendarClock;
	label: string;
	value: string;
}) {
	return (
		<div className="app-muted-surface p-4">
			<div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
				<Icon className="size-4" />
				{label}
			</div>
			<p className="mt-3 text-sm font-medium text-foreground">{value}</p>
		</div>
	);
}

function ActionFeedback({
	state,
	successTitle,
	errorTitle,
}: {
	state: AccountActionState;
	successTitle: string;
	errorTitle: string;
}) {
	if (state.status === "idle") {
		return null;
	}

	const isSuccess = state.status === "success";
	const Icon = isSuccess ? CheckCircle2 : CircleAlert;

	return (
		<Alert variant={isSuccess ? "success" : "destructive"}>
			<Icon />
			<div className="space-y-1">
				<AlertTitle>{isSuccess ? successTitle : errorTitle}</AlertTitle>
				<AlertDescription>{state.message}</AlertDescription>
			</div>
		</Alert>
	);
}

function FormSubmitButton({
	idleLabel,
	pendingLabel,
}: {
	idleLabel: string;
	pendingLabel: string;
}) {
	const { pending } = useFormStatus();

	return (
		<Button type="submit" disabled={pending} className="w-full sm:w-auto">
			{pending ? <Loader2 className="size-4 animate-spin" /> : null}
			{pending ? pendingLabel : idleLabel}
		</Button>
	);
}

function AccountSkeleton() {
	return (
		<div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_420px]">
			<div className="space-y-6">
				<div className="app-surface p-6">
					<div className="h-8 w-52 animate-pulse rounded-md bg-muted-foreground/15" />
					<div className="mt-4 h-4 w-full max-w-lg animate-pulse rounded-md bg-muted-foreground/12" />
					<div className="mt-6 grid gap-3 sm:grid-cols-3">
						<div className="h-24 animate-pulse rounded-lg bg-muted-foreground/10" />
						<div className="h-24 animate-pulse rounded-lg bg-muted-foreground/10" />
						<div className="h-24 animate-pulse rounded-lg bg-muted-foreground/10" />
					</div>
				</div>
				<div className="h-64 animate-pulse rounded-lg bg-muted-foreground/10" />
			</div>
			<div className="h-96 animate-pulse rounded-lg bg-muted-foreground/10" />
		</div>
	);
}

function SessionListSkeleton() {
	return (
		<div className="space-y-3">
			<div className="h-28 animate-pulse rounded-lg bg-muted-foreground/10" />
			<div className="h-28 animate-pulse rounded-lg bg-muted-foreground/10" />
		</div>
	);
}

function readFormValue(formData: FormData, field: string) {
	const value = formData.get(field);
	return typeof value === "string" ? value.trim() : "";
}

function getAuthErrorMessage(error: AuthErrorLike, fallback: string) {
	const code = error.code?.trim();
	const message = error.message?.trim();
	const statusText = error.statusText?.trim();

	if (code === "SESSION_NOT_FRESH" || message?.toLowerCase().includes("not fresh")) {
		return "Sign in again before listing or revoking sessions. Better Auth requires a fresh session for this action.";
	}

	if (code === "SESSION_EXPIRED" || error.status === 401) {
		return "Your session expired. Sign in again before changing account settings.";
	}

	if (code === "INVALID_PASSWORD") {
		return "The current password is incorrect.";
	}

	return message || statusText || fallback;
}

function formatDate(value: Date | string) {
	const date = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(date.getTime())) {
		return "Unknown";
	}

	return dateFormatter.format(date);
}

function summarizeUserAgent(userAgent: string) {
	const normalized = userAgent.trim();

	if (!normalized) {
		return "Unknown device";
	}

	if (normalized.includes("Edg/")) {
		return "Microsoft Edge";
	}

	if (normalized.includes("Chrome/")) {
		return "Chrome";
	}

	if (normalized.includes("Firefox/")) {
		return "Firefox";
	}

	if (normalized.includes("Safari/")) {
		return "Safari";
	}

	return normalized.slice(0, 48);
}

function getInitials(name: string, email: string) {
	const source = name.trim() || email.trim();
	const parts = source.split(/\s+/).filter(Boolean);

	if (parts.length >= 2) {
		return `${parts[0]?.charAt(0) ?? ""}${parts[1]?.charAt(0) ?? ""}`.toUpperCase();
	}

	return source.slice(0, 2).toUpperCase();
}
