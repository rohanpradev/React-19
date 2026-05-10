import { ArrowUpRight, KeyRound, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { authClient } from "@/auth/client";
import { getDefaultAuthRedirectPath, sanitizeRedirectPath } from "@/auth/redirects";
import type { SocialProviderAvailability, SocialProviderId } from "@/auth/social-providers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "sign-in" | "sign-up";

type AuthActionState = {
	status: "idle" | "success" | "error";
	message: string;
};

type SocialProvidersPayload = {
	providers: SocialProviderAvailability;
};

const initialActionState: AuthActionState = {
	status: "idle",
	message: "",
};

const emptySocialProviders: SocialProviderAvailability = {
	google: false,
	github: false,
};

const authDocsLinks = [
	{
		label: "Bun SQLite adapter",
		href: "https://better-auth.com/docs/adapters/sqlite#bun-built-in-sqlite",
	},
	{
		label: "Google setup",
		href: "https://better-auth.com/docs/authentication/google",
	},
	{
		label: "GitHub setup",
		href: "https://better-auth.com/docs/authentication/github",
	},
	{
		label: "Email and password",
		href: "https://better-auth.com/docs/authentication/email-password",
	},
] as const;

export function AuthPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const nextPath = sanitizeRedirectPath(searchParams.get("next") ?? getDefaultAuthRedirectPath());
	const requestedMode: AuthMode = searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
	const [mode, setMode] = useState<AuthMode>(requestedMode);
	const [providers, setProviders] = useState<SocialProviderAvailability>(emptySocialProviders);
	const [isLoadingProviders, setIsLoadingProviders] = useState(true);
	const [socialError, setSocialError] = useState<string | null>(null);
	const [activeSocialProvider, setActiveSocialProvider] = useState<SocialProviderId | null>(null);
	const oauthError = getOAuthErrorMessage(
		searchParams.get("error"),
		searchParams.get("error_description"),
	);
	const appOrigin =
		typeof window === "undefined" ? "http://localhost:3000" : window.location.origin;

	useEffect(() => {
		setMode(requestedMode);
	}, [requestedMode]);

	useEffect(() => {
		const controller = new AbortController();

		async function loadProviders() {
			setIsLoadingProviders(true);

			try {
				const response = await fetch("/api/auth-providers", {
					signal: controller.signal,
				});

				if (!response.ok) {
					throw new Error(`Unable to load auth providers (${response.status}).`);
				}

				const payload = (await response.json()) as SocialProvidersPayload;

				if (!controller.signal.aborted) {
					setProviders(payload.providers);
				}
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}

				if (!controller.signal.aborted) {
					setProviders(emptySocialProviders);
					setSocialError(
						error instanceof Error ? error.message : "Unable to load social sign-in providers.",
					);
				}
			} finally {
				if (!controller.signal.aborted) {
					setIsLoadingProviders(false);
				}
			}
		}

		void loadProviders();

		return () => controller.abort();
	}, []);

	async function handleSocialSignIn(provider: SocialProviderId) {
		setSocialError(null);
		setActiveSocialProvider(provider);

		try {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: nextPath,
				newUserCallbackURL: nextPath,
				errorCallbackURL: createAuthErrorCallbackUrl(nextPath, mode),
			});

			if (result.error) {
				setSocialError(
					getAuthErrorMessage(
						result.error,
						`Unable to start ${formatProviderLabel(provider)} sign-in.`,
					),
				);
				return;
			}

			navigate(nextPath, { replace: true });
		} catch (error) {
			setSocialError(
				error instanceof Error
					? error.message
					: `Unable to start ${formatProviderLabel(provider)} sign-in.`,
			);
		} finally {
			setActiveSocialProvider(null);
		}
	}

	return (
		<main className="min-h-screen w-full bg-background">
			<div className="mx-auto grid min-h-screen max-w-6xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:p-8">
				<section
					aria-labelledby="auth-intro-title"
					className="order-2 flex min-w-0 flex-col justify-between rounded-lg border border-border/70 bg-card/95 p-5 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.42)] sm:p-7 lg:order-1 lg:p-8 dark:shadow-[0_20px_60px_-48px_rgba(0,0,0,0.84)]"
				>
					<div className="space-y-7">
						<div className="flex items-center gap-3">
							<span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
								<ShieldCheck className="size-5" />
							</span>
							<div className="min-w-0">
								<p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
									React Systems Studio
								</p>
								<p className="mt-1 text-sm font-medium text-foreground">Private Bun workspace</p>
							</div>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Better Auth</Badge>
							<Badge variant="outline">Bun built-in SQLite</Badge>
						</div>

						<div className="space-y-4">
							<h1
								id="auth-intro-title"
								className="font-display max-w-3xl text-4xl leading-none text-foreground sm:text-5xl"
							>
								Sign in to the React systems lab.
							</h1>
							<p className="max-w-2xl text-base leading-7 text-muted-foreground">
								One private workspace for React architecture demos, protected Bun APIs, and the
								server-backed revenue console.
							</p>
						</div>

						<div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
							<TrustItem
								icon={ShieldCheck}
								title="Protected APIs"
								detail="Customer data stays behind a live session."
							/>
							<TrustItem
								icon={LockKeyhole}
								title="Local SQLite"
								detail="Auth and app tables share the Bun database."
							/>
							<TrustItem
								icon={KeyRound}
								title="Email + OAuth"
								detail="Use local credentials or configured providers."
							/>
						</div>
					</div>

					<div className="mt-8 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
						<div className="rounded-lg border border-border/65 bg-background/80 p-4">
							<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Redirect
							</p>
							<p className="mt-2 leading-6">
								After authentication, continue to{" "}
								<span className="font-medium text-foreground">{nextPath}</span>.
							</p>
						</div>

						<details className="rounded-lg border border-border/65 bg-background/80 p-4">
							<summary className="cursor-pointer text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Developer setup
							</summary>
							<div className="mt-3 grid gap-2">
								<div className="space-y-1 text-xs leading-5">
									<p>
										Google:{" "}
										<code className="rounded bg-muted/60 px-1.5 py-0.5 text-foreground">
											{appOrigin}/api/auth/callback/google
										</code>
									</p>
									<p>
										GitHub:{" "}
										<code className="rounded bg-muted/60 px-1.5 py-0.5 text-foreground">
											{appOrigin}/api/auth/callback/github
										</code>
									</p>
								</div>
								<div className="flex flex-wrap gap-2">
									{authDocsLinks.slice(0, 2).map((link) => (
										<Button key={link.href} variant="outline" size="sm" asChild>
											<a href={link.href} target="_blank" rel="noreferrer">
												{link.label}
												<ArrowUpRight className="size-4" />
											</a>
										</Button>
									))}
								</div>
							</div>
						</details>
					</div>
				</section>

				<section className="order-1 flex items-center lg:order-2" aria-labelledby="auth-form-title">
					<Card className="w-full border-border/70 bg-card/95 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.42)] dark:shadow-[0_20px_60px_-48px_rgba(0,0,0,0.84)]">
						<CardHeader className="gap-4">
							<div className="grid grid-cols-2 gap-2 rounded-lg border border-border/65 bg-muted/35 p-1">
								<Button
									type="button"
									size="sm"
									variant={mode === "sign-in" ? "default" : "ghost"}
									onClick={() => setMode("sign-in")}
								>
									Sign in
								</Button>
								<Button
									type="button"
									size="sm"
									variant={mode === "sign-up" ? "default" : "ghost"}
									onClick={() => setMode("sign-up")}
								>
									Create account
								</Button>
							</div>
							<div className="space-y-1">
								<CardTitle id="auth-form-title">
									{mode === "sign-in" ? "Access your workspace" : "Create a workspace login"}
								</CardTitle>
								<CardDescription className="leading-6">
									{mode === "sign-in"
										? "Use email or a configured provider."
										: "Start with email or a configured provider."}
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{oauthError || socialError ? (
								<Alert variant="destructive">
									<div className="space-y-1">
										<AlertTitle>Authentication could not continue</AlertTitle>
										<AlertDescription>{socialError ?? oauthError}</AlertDescription>
									</div>
								</Alert>
							) : null}

							<SocialAuthSection
								providers={providers}
								isLoading={isLoadingProviders}
								activeProvider={activeSocialProvider}
								onContinue={handleSocialSignIn}
							/>

							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-border/60" />
								</div>
								<div className="relative flex justify-center">
									<span className="bg-card px-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
										Or continue with email
									</span>
								</div>
							</div>

							{mode === "sign-in" ? (
								<SignInForm nextPath={nextPath} />
							) : (
								<SignUpForm nextPath={nextPath} />
							)}
						</CardContent>
					</Card>
				</section>
			</div>
		</main>
	);
}

function SocialAuthSection({
	providers,
	isLoading,
	activeProvider,
	onContinue,
}: {
	providers: SocialProviderAvailability;
	isLoading: boolean;
	activeProvider: SocialProviderId | null;
	onContinue: (provider: SocialProviderId) => Promise<void>;
}) {
	const hasEnabledProvider = providers.google || providers.github;

	return (
		<div className="space-y-3">
			<div className="grid gap-3 sm:grid-cols-2">
				<SocialButton
					provider="google"
					label="Continue with Google"
					enabled={providers.google}
					isLoading={isLoading}
					isPending={activeProvider === "google"}
					onClick={onContinue}
					icon={<ProviderMonogram label="G" className="text-[#ea4335]" />}
				/>
				<SocialButton
					provider="github"
					label="Continue with GitHub"
					enabled={providers.github}
					isLoading={isLoading}
					isPending={activeProvider === "github"}
					onClick={onContinue}
					icon={<ProviderMonogram label="GH" />}
				/>
			</div>

			{!isLoading && !hasEnabledProvider ? (
				<div className="rounded-lg border border-border/65 bg-muted/24 p-4 text-sm leading-6 text-muted-foreground">
					Social sign-in becomes available after setting the Google or GitHub oauth environment
					variables on the server.
				</div>
			) : null}
		</div>
	);
}

function ProviderMonogram({ label, className }: { label: string; className?: string }) {
	return (
		<span
			className={`flex size-5 items-center justify-center rounded-md border border-current/15 bg-muted/40 text-[10px] font-bold ${className ?? ""}`}
		>
			{label}
		</span>
	);
}

function SocialButton({
	provider,
	label,
	enabled,
	isLoading,
	isPending,
	onClick,
	icon,
}: {
	provider: SocialProviderId;
	label: string;
	enabled: boolean;
	isLoading: boolean;
	isPending: boolean;
	onClick: (provider: SocialProviderId) => Promise<void>;
	icon: ReactNode;
}) {
	const isDisabled = isLoading || !enabled || isPending;

	return (
		<Button
			type="button"
			variant="outline"
			className="h-11 justify-start"
			disabled={isDisabled}
			onClick={() => void onClick(provider)}
		>
			{isPending || isLoading ? <Loader2 className="size-4 animate-spin" /> : icon}
			<span className="flex-1 text-left">
				{isLoading
					? "Checking provider..."
					: enabled
						? label
						: `${formatProviderLabel(provider)} not configured`}
			</span>
		</Button>
	);
}

function SignInForm({ nextPath }: { nextPath: string }) {
	const navigate = useNavigate();
	const [state, submitAction, isPending] = useActionState(
		async (_previousState: AuthActionState, formData: FormData) => {
			const email = readFormValue(formData, "email");
			const password = readFormValue(formData, "password");
			const result = await authClient.signIn.email({
				email,
				password,
				callbackURL: nextPath,
			});

			if (result.error) {
				return {
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to sign in with those credentials."),
				} satisfies AuthActionState;
			}

			return {
				status: "success",
				message: "",
			} satisfies AuthActionState;
		},
		initialActionState,
	);

	useEffect(() => {
		if (state.status === "success") {
			navigate(nextPath, { replace: true });
		}
	}, [navigate, nextPath, state.status]);

	return (
		<form action={submitAction} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="sign-in-email">Email</Label>
				<Input
					id="sign-in-email"
					name="email"
					type="email"
					autoComplete="email"
					required
					placeholder="you@company.com"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="sign-in-password">Password</Label>
				<Input
					id="sign-in-password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					placeholder="Enter your password"
				/>
			</div>

			{state.status === "error" ? (
				<Alert variant="destructive">
					<div className="space-y-1">
						<AlertTitle>Sign-in failed</AlertTitle>
						<AlertDescription>{state.message}</AlertDescription>
					</div>
				</Alert>
			) : null}

			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Signing in..." : "Sign in"}
			</Button>
		</form>
	);
}

function SignUpForm({ nextPath }: { nextPath: string }) {
	const navigate = useNavigate();
	const [state, submitAction, isPending] = useActionState(
		async (_previousState: AuthActionState, formData: FormData) => {
			const name = readFormValue(formData, "name");
			const email = readFormValue(formData, "email");
			const password = readFormValue(formData, "password");
			const result = await authClient.signUp.email({
				name,
				email,
				password,
				callbackURL: nextPath,
			});

			if (result.error) {
				return {
					status: "error",
					message: getAuthErrorMessage(result.error, "Unable to create that account."),
				} satisfies AuthActionState;
			}

			return {
				status: "success",
				message: "",
			} satisfies AuthActionState;
		},
		initialActionState,
	);

	useEffect(() => {
		if (state.status === "success") {
			navigate(nextPath, { replace: true });
		}
	}, [navigate, nextPath, state.status]);

	return (
		<form action={submitAction} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="sign-up-name">Full name</Label>
				<Input
					id="sign-up-name"
					name="name"
					autoComplete="name"
					required
					placeholder="Rohan Sharma"
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="sign-up-email">Email</Label>
				<Input
					id="sign-up-email"
					name="email"
					type="email"
					autoComplete="email"
					required
					placeholder="you@company.com"
				/>
			</div>

			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3">
					<Label htmlFor="sign-up-password">Password</Label>
					<span className="text-xs text-muted-foreground">10+ characters</span>
				</div>
				<Input
					id="sign-up-password"
					name="password"
					type="password"
					autoComplete="new-password"
					required
					minLength={10}
					placeholder="Choose a stronger password"
				/>
			</div>

			{state.status === "error" ? (
				<Alert variant="destructive">
					<div className="space-y-1">
						<AlertTitle>Account creation failed</AlertTitle>
						<AlertDescription>{state.message}</AlertDescription>
					</div>
				</Alert>
			) : null}

			<Button type="submit" className="w-full" disabled={isPending}>
				{isPending ? "Creating account..." : "Create account"}
			</Button>
		</form>
	);
}

function TrustItem({
	icon: Icon,
	title,
	detail,
}: {
	icon: typeof ShieldCheck;
	title: string;
	detail: string;
}) {
	return (
		<div className="rounded-lg border border-border/65 bg-background/80 p-4">
			<div className="flex items-center gap-3">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
					<Icon className="size-4" />
				</span>
				<div className="min-w-0">
					<p className="text-sm font-medium text-foreground">{title}</p>
					<p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p>
				</div>
			</div>
		</div>
	);
}

function readFormValue(formData: FormData, field: string) {
	const value = formData.get(field);
	return typeof value === "string" ? value.trim() : "";
}

function formatProviderLabel(provider: SocialProviderId) {
	return provider === "google" ? "Google" : "GitHub";
}

function createAuthErrorCallbackUrl(nextPath: string, mode: AuthMode) {
	return `/auth?next=${encodeURIComponent(nextPath)}&mode=${mode}`;
}

function getAuthErrorMessage(
	error: {
		message?: string;
		status?: number;
	},
	fallback: string,
) {
	return error.message?.trim() || fallback;
}

function getOAuthErrorMessage(error: string | null, description: string | null) {
	if (!error) {
		return null;
	}

	const normalized = error.trim();
	const mappedMessage =
		{
			access_denied: "The provider denied access to the requested account.",
			email_not_found:
				"The provider did not return an email address. Check the provider app permissions and account email visibility.",
			invalid_code: "The provider callback could not be validated.",
			no_callback_url: "No application redirect target was preserved for this sign-in.",
			oauth_provider_not_found: "The selected oauth provider is not configured on this server.",
			unable_to_get_user_info:
				"The provider authentication succeeded, but Better Auth could not fetch the profile data needed to create or sign in the user.",
		}[normalized] ?? "The oauth sign-in flow could not be completed.";

	if (!description) {
		return mappedMessage;
	}

	return `${mappedMessage} ${description}`;
}
