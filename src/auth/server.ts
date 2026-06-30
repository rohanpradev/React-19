import { betterAuth } from "better-auth";

import { configuredSocialProviders } from "@/auth/social-providers";
import { sqlite } from "@/db";

const authBaseUrl = Bun.env.BETTER_AUTH_URL ?? `http://localhost:${Bun.env.PORT ?? "3000"}`;
const hasSocialProviders = Object.keys(configuredSocialProviders).length > 0;
const trustedOrigins = Array.from(
	new Set(
		[authBaseUrl, ...(Bun.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",")]
			.map((origin) => origin.trim())
			.filter(Boolean),
	),
);

export const auth = betterAuth({
	database: sqlite,
	baseURL: authBaseUrl,
	basePath: "/api/auth",
	trustedOrigins,
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 10,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		freshAge: 60 * 10,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: "compact",
		},
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100,
		customRules: {
			"/sign-in/email": {
				window: 60,
				max: 5,
			},
			"/sign-up/email": {
				window: 60,
				max: 5,
			},
			"/get-session": false,
		},
	},
	...(hasSocialProviders ? { socialProviders: configuredSocialProviders } : {}),
});
