import * as v from "valibot";

export type SocialProviderId = "google" | "github";
export type SocialProviderAvailability = Record<SocialProviderId, boolean>;

type ConfiguredSocialProviders = Partial<{
	google: {
		clientId: string;
		clientSecret: string;
		prompt: "select_account";
	};
	github: {
		clientId: string;
		clientSecret: string;
	};
}>;

const placeholderAuthSecrets = new Set([
	"better-auth-secret-12345678901234567890",
	"replace-with-a-strong-random-secret",
	"replace-this-local-docker-secret",
]);

const optionalText = v.optional(v.pipe(v.string(), v.trim(), v.minLength(1)), undefined);
const optionalUrl = v.optional(
	v.pipe(v.string(), v.trim(), v.url("BETTER_AUTH_URL must be a valid URL.")),
	undefined,
);

const rawServerEnvSchema = v.object({
	NODE_ENV: v.pipe(
		v.optional(v.string(), "development"),
		v.transform((value) => (value === "production" ? "production" : "development")),
	),
	PORT: v.pipe(
		v.optional(v.string(), "3000"),
		v.trim(),
		v.transform((value) => Number(value)),
		v.integer("PORT must be an integer."),
		v.minValue(1, "PORT must be between 1 and 65535."),
		v.maxValue(65535, "PORT must be between 1 and 65535."),
	),
	DB_FILE_NAME: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1)), "mydb.sqlite"),
	BETTER_AUTH_URL: optionalUrl,
	BETTER_AUTH_SECRET: optionalText,
	BETTER_AUTH_TRUSTED_ORIGINS: optionalText,
	GOOGLE_CLIENT_ID: optionalText,
	GOOGLE_CLIENT_SECRET: optionalText,
	GITHUB_CLIENT_ID: optionalText,
	GITHUB_CLIENT_SECRET: optionalText,
});

type RawServerEnv = v.InferOutput<typeof rawServerEnvSchema>;

const serverEnvSchema = v.pipe(
	rawServerEnvSchema,
	v.check(
		(env) => env.NODE_ENV !== "production" || Boolean(env.BETTER_AUTH_URL),
		"BETTER_AUTH_URL is required when NODE_ENV=production.",
	),
	v.check(
		(env) => env.NODE_ENV !== "production" || Boolean(env.BETTER_AUTH_SECRET),
		"BETTER_AUTH_SECRET is required when NODE_ENV=production.",
	),
	v.check(
		(env) =>
			env.NODE_ENV !== "production" || !isPlaceholderAuthSecret(env.BETTER_AUTH_SECRET ?? ""),
		"BETTER_AUTH_SECRET must be replaced with a strong random secret.",
	),
	v.check(
		(env) => env.NODE_ENV !== "production" || (env.BETTER_AUTH_SECRET?.length ?? 0) >= 32,
		"BETTER_AUTH_SECRET must be at least 32 characters.",
	),
	v.transform((env) => {
		const isProduction = env.NODE_ENV === "production";
		const authBaseURL = env.BETTER_AUTH_URL ?? (isProduction ? "" : `http://localhost:${env.PORT}`);
		const socialProviders = buildSocialProviders(env);

		return {
			mode: env.NODE_ENV,
			isDevelopment: !isProduction,
			isProduction,
			port: env.PORT,
			dbFileName: env.DB_FILE_NAME,
			auth: {
				baseURL: authBaseURL,
				secret: getRuntimeAuthSecret(env.BETTER_AUTH_SECRET),
				trustedOrigins: uniqueValues([
					authBaseURL,
					...parseCommaSeparatedValues(env.BETTER_AUTH_TRUSTED_ORIGINS),
				]),
				socialProviders,
			},
			socialProviderAvailability: {
				google: Boolean(socialProviders.google),
				github: Boolean(socialProviders.github),
			} satisfies SocialProviderAvailability,
		};
	}),
);

export type ServerEnv = v.InferOutput<typeof serverEnvSchema>;

function readRawServerEnv() {
	return normalizeEnvRecord({
		NODE_ENV: process.env.NODE_ENV,
		PORT: Bun.env.PORT,
		DB_FILE_NAME: Bun.env.DB_FILE_NAME,
		BETTER_AUTH_URL: Bun.env.BETTER_AUTH_URL,
		BETTER_AUTH_SECRET: Bun.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_TRUSTED_ORIGINS: Bun.env.BETTER_AUTH_TRUSTED_ORIGINS,
		GOOGLE_CLIENT_ID: Bun.env.GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET: Bun.env.GOOGLE_CLIENT_SECRET,
		GITHUB_CLIENT_ID: Bun.env.GITHUB_CLIENT_ID,
		GITHUB_CLIENT_SECRET: Bun.env.GITHUB_CLIENT_SECRET,
	});
}

function normalizeEnvRecord<T extends Record<string, string | undefined>>(env: T) {
	return Object.fromEntries(
		Object.entries(env).map(([key, value]) => {
			const normalizedValue = value?.trim();
			return [key, normalizedValue ? normalizedValue : undefined];
		}),
	) as T;
}

function isPlaceholderAuthSecret(secret: string) {
	const normalized = secret.toLowerCase();

	return (
		placeholderAuthSecrets.has(normalized) ||
		normalized.startsWith("replace-") ||
		normalized.startsWith("change-me")
	);
}

function getRuntimeAuthSecret(secret: string | undefined) {
	return secret && !isPlaceholderAuthSecret(secret) ? secret : undefined;
}

function parseCommaSeparatedValues(value: string | undefined) {
	return value
		? value
				.split(",")
				.map((entry) => entry.trim())
				.filter(Boolean)
		: [];
}

function uniqueValues(values: string[]) {
	return Array.from(new Set(values.filter(Boolean)));
}

function buildSocialProviders(env: RawServerEnv) {
	return {
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET,
						prompt: "select_account" as const,
					},
				}
			: {}),
		...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? {
					github: {
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET,
					},
				}
			: {}),
	} satisfies ConfiguredSocialProviders;
}

function loadServerEnv() {
	const result = v.safeParse(serverEnvSchema, readRawServerEnv());

	if (result.success) {
		return result.output;
	}

	throw new Error(
		[
			"Invalid server environment configuration:",
			...result.issues.map((issue) => `- ${issue.message}`),
		].join("\n"),
	);
}

export const serverEnv = loadServerEnv();
