import {
	ArrowUpRight,
	KeyRound,
	Loader2,
	LockKeyhole,
	ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authClient } from "@/auth/client";
import {
	getDefaultAuthRedirectPath,
	sanitizeRedirectPath,
} from "@/auth/redirects";
import type {
	SocialProviderAvailability,
	SocialProviderId,
} from "@/auth/social-providers";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
	const nextPath = sanitizeRedirectPath(
		searchParams.get("next") ?? getDefaultAuthRedirectPath(),
	);
	const requestedMode: AuthMode =
		searchParams.get("mode") === "sign-up" ? "sign-up" : "sign-in";
	const [mode, setMode] = useState<AuthMode>(requestedMode);
	const [providers, setProviders] =
		useState<SocialProviderAvailability>(emptySocialProviders);
	const [isLoadingProviders, setIsLoadingProviders] = useState(true);
	const [socialError, setSocialError] = useState<string | null>(null);
	const [activeSocialProvider, setActiveSocialProvider] =
		useState<SocialProviderId | null>(null);
	const oauthError = getOAuthErrorMessage(
		searchParams.get("error"),
		searchParams.get("error_description"),
	);
	const appOrigin =
		typeof window === "undefined"
			? "http://localhost:3000"
			: window.location.origin;

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
					throw new Error(
						`Unable to load auth providers (${response.status}).`,
					);
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
						error instanceof Error
							? error.message
							: "Unable to load social sign-in providers.",
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
		<div className="relative min-h-screen w-full overflow-hidden">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute top-[-8rem] left-[8%] h-72 w-72 rounded-full bg-primary/18 blur-3xl" />
				<div className="absolute right-[-5rem] bottom-[-4rem] h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
			</div>

			<div className="relative mx-auto grid min-h-screen max-w-[1400px] gap-8 p-4 lg:grid-cols-[minmax(0,1.08fr)_460px] lg:p-8">
				<section className="flex min-w-0 flex-col justify-between rounded-[2.2rem] border border-border/65 bg-background/78 p-6 shadow-2xl shadow-black/[0.06] backdrop-blur-xl sm:p-8 lg:p-10 dark:shadow-black/[0.3]">
					<div className="space-y-8">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">Better Auth</Badge>
							<Badge variant="outline">Google + GitHub oauth</Badge>
							<Badge variant="outline">Bun built-in SQLite</Badge>
						</div>

						<div className="space-y-5">
							<h1 className="font-display max-w-4xl text-5xl leading-none text-foreground sm:text-6xl">
								Private access for the Bun + React lab.
							</h1>
							<p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
								The app now uses Better Auth on the same `bun:sqlite` connection
								that already backs your Drizzle data. Email/password, Google,
								and GitHub all land in the same account system, and the customer
								APIs stay protected server-side.
							</p>
						</div>

						<div className="grid gap-4 md:grid-cols-3">
							<FeatureCard
								icon={ShieldCheck}
								title="Protected Bun routes"
								detail="Revenue and autocomplete APIs require a live Better Auth session before they touch customer data."
							/>
							<FeatureCard
								icon={LockKeyhole}
								title="Same SQLite file"
								detail="Auth and application tables share the existing Bun SQLite database instead of introducing another persistence layer."
							/>
							<FeatureCard
								icon={KeyRound}
								title="Email and oauth ready"
								detail="Email/password, Google, and GitHub all feed the same Better Auth account and session model."
							/>
						</div>
					</div>

					<div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
						<div className="rounded-[1.6rem] border border-border/65 bg-card/92 p-5">
							<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Flow
							</p>
							<p className="mt-3 text-sm leading-7 text-muted-foreground">
								After authentication, you will continue to{" "}
								<span className="font-medium text-foreground">{nextPath}</span>.
								The redirect is restricted to in-app paths so auth cannot be
								used as an open redirect.
							</p>
						</div>

						<div className="rounded-[1.6rem] border border-border/65 bg-card/92 p-5">
							<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								OAuth callback URLs
							</p>
							<div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
								<p>
									Google:{" "}
									<code className="rounded bg-muted/60 px-2 py-1 text-xs text-foreground">
										{appOrigin}/api/auth/callback/google
									</code>
								</p>
								<p>
									GitHub:{" "}
									<code className="rounded bg-muted/60 px-2 py-1 text-xs text-foreground">
										{appOrigin}/api/auth/callback/github
									</code>
								</p>
							</div>
						</div>

						<div className="rounded-[1.6rem] border border-border/65 bg-card/92 p-5 xl:col-span-2">
							<p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
								Official docs
							</p>
							<div className="mt-3 grid gap-2 sm:grid-cols-2">
								{authDocsLinks.map((link) => (
									<Button key={link.href} variant="outline" asChild>
										<a href={link.href} target="_blank" rel="noreferrer">
											{link.label}
											<ArrowUpRight className="size-4" />
										</a>
									</Button>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="flex items-center">
					<Card className="w-full border-border/70 bg-card/94 shadow-2xl shadow-black/[0.09] backdrop-blur-xl dark:shadow-black/[0.34]">
						<CardHeader className="gap-4">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									type="button"
									size="sm"
									variant={mode === "sign-in" ? "default" : "outline"}
									onClick={() => setMode("sign-in")}
								>
									Sign in
								</Button>
								<Button
									type="button"
									size="sm"
									variant={mode === "sign-up" ? "default" : "outline"}
									onClick={() => setMode("sign-up")}
								>
									Create account
								</Button>
							</div>
							<div className="space-y-1">
								<CardTitle>
									{mode === "sign-in"
										? "Access the private workspace"
										: "Create your private workspace login"}
								</CardTitle>
								<CardDescription className="leading-6">
									{mode === "sign-in"
										? "Use your account to unlock the protected demos and customer APIs."
										: "Create a local account or use oauth to enter through the same Better Auth user system."}
								</CardDescription>
							</div>
						</CardHeader>
						<CardContent className="space-y-6">
							{oauthError || socialError ? (
								<Alert variant="destructive">
									<div className="space-y-1">
										<AlertTitle>Authentication could not continue</AlertTitle>
										<AlertDescription>
											{socialError ?? oauthError}
										</AlertDescription>
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
		</div>
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
				<div className="rounded-[1.2rem] border border-border/65 bg-muted/24 p-4 text-sm leading-6 text-muted-foreground">
					Social sign-in becomes available after setting the Google or GitHub
					oauth environment variables on the server.
				</div>
			) : null}
		</div>
	);
}

function ProviderMonogram({
	label,
	className,
}: {
	label: string;
	className?: string;
}) {
	return (
		<span
			className={`flex size-5 items-center justify-center rounded-full border border-current/15 bg-muted/40 text-[10px] font-bold ${className ?? ""}`}
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
			{isPending || isLoading ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				icon
			)}
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
					message: getAuthErrorMessage(
						result.error,
						"Unable to sign in with those credentials.",
					),
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
					message: getAuthErrorMessage(
						result.error,
						"Unable to create that account.",
					),
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

function FeatureCard({
	icon: Icon,
	title,
	detail,
}: {
	icon: typeof ShieldCheck;
	title: string;
	detail: string;
}) {
	return (
		<div className="rounded-[1.6rem] border border-border/65 bg-card/94 p-5">
			<div className="flex items-start gap-3">
				<span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
					<Icon className="size-5" />
				</span>
				<div>
					<p className="font-medium text-foreground">{title}</p>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">
						{detail}
					</p>
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

function getOAuthErrorMessage(
	error: string | null,
	description: string | null,
) {
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
			no_callback_url:
				"No application redirect target was preserved for this sign-in.",
			oauth_provider_not_found:
				"The selected oauth provider is not configured on this server.",
			unable_to_get_user_info:
				"The provider authentication succeeded, but Better Auth could not fetch the profile data needed to create or sign in the user.",
		}[normalized] ?? "The oauth sign-in flow could not be completed.";

	if (!description) {
		return mappedMessage;
	}

	return `${mappedMessage} ${description}`;
}
