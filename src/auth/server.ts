import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";

import { accessControl, appRoles } from "@/auth/permissions";
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
	user: { deleteUser: { enabled: false } },
	plugins: [
		admin({ ac: accessControl, roles: appRoles, defaultRole: "viewer", adminRoles: ["admin"] }),
	],
	databaseHooks: {
		user: {
			create: {
				before: async (user) => ({ data: { ...user, role: "viewer" } }),
			},
		},
	},
	advanced: {
		// Keep real origin/CSRF protections enabled in regression tests as well.
		disableOriginCheck: false,
		disableCSRFCheck: false,
		ipAddress: {
			ipAddressHeaders: serverEnv.auth.ipAddressHeaders,
		},
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 10,
		maxPasswordLength: 128,
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
		freshAge: 60 * 10,
		cookieCache: {
			// Browser session reads and API authorization must agree after remote revocation.
			// Better Auth also expires cache cookies issued by earlier deployments.
			enabled: false,
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
