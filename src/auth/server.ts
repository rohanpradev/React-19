import { betterAuth } from "better-auth";

import { serverEnv } from "@/config/server-env";
import { sqlite } from "@/db";

const hasSocialProviders = Object.keys(serverEnv.auth.socialProviders).length > 0;

export const auth = betterAuth({
	database: sqlite,
	...(serverEnv.auth.secret ? { secret: serverEnv.auth.secret } : {}),
	...(serverEnv.auth.versionedSecrets.length > 0
		? { secrets: serverEnv.auth.versionedSecrets }
		: {}),
	baseURL: serverEnv.auth.baseURL,
	basePath: "/api/auth",
	trustedOrigins: serverEnv.auth.trustedOrigins,
	advanced: {
		ipAddress: {
			ipAddressHeaders: serverEnv.auth.ipAddressHeaders,
		},
	},
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
	...(hasSocialProviders ? { socialProviders: serverEnv.auth.socialProviders } : {}),
});
