export type SocialProviderId = "google" | "github";

export type SocialProviderAvailability = Record<SocialProviderId, boolean>;

function hasNonEmptyEnv(name: string) {
	const value = Bun.env[name];
	return typeof value === "string" && value.trim().length > 0;
}

const googleConfigured =
	hasNonEmptyEnv("GOOGLE_CLIENT_ID") && hasNonEmptyEnv("GOOGLE_CLIENT_SECRET");
const githubConfigured =
	hasNonEmptyEnv("GITHUB_CLIENT_ID") && hasNonEmptyEnv("GITHUB_CLIENT_SECRET");

export const socialProviderAvailability: SocialProviderAvailability = {
	google: googleConfigured,
	github: githubConfigured,
};

export const configuredSocialProviders = {
	...(googleConfigured
		? {
				google: {
					clientId: Bun.env.GOOGLE_CLIENT_ID as string,
					clientSecret: Bun.env.GOOGLE_CLIENT_SECRET as string,
					prompt: "select_account" as const,
				},
			}
		: {}),
	...(githubConfigured
		? {
				github: {
					clientId: Bun.env.GITHUB_CLIENT_ID as string,
					clientSecret: Bun.env.GITHUB_CLIENT_SECRET as string,
				},
			}
		: {}),
};
