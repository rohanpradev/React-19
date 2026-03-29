import { betterAuth } from "better-auth";
import { configuredSocialProviders } from "@/auth/social-providers";
import { sqlite } from "@/db";

const authBaseUrl =
	Bun.env.BETTER_AUTH_URL ?? `http://localhost:${Bun.env.PORT ?? "3000"}`;
const hasSocialProviders = Object.keys(configuredSocialProviders).length > 0;

export const auth = betterAuth({
	database: sqlite,
	baseURL: authBaseUrl,
	basePath: "/api/auth",
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 10,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: "compact",
		},
	},
	...(hasSocialProviders ? { socialProviders: configuredSocialProviders } : {}),
});
