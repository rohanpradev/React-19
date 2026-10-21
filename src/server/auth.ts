import { type AppPermission, hasPermission } from "@/auth/permissions";
import { auth } from "@/auth/server";
import { socialProviderAvailability } from "@/auth/social-providers";
import { sqlite } from "@/db";

import { isUserActive } from "./access";
import { privateJson } from "./responses";

export async function getRequestSession(request: Request) {
	return auth.api.getSession({
		headers: request.headers,
		// API authorization must observe revocation immediately, even with a cached cookie.
		query: { disableCookieCache: true },
	});
}

export async function requireRequestSession(request: Request) {
	const session = await getRequestSession(request);

	if (!session?.session || !session.user) {
		return null;
	}
	// Read the role from the authority for every request; never authorize from a presentation cookie.
	const current = sqlite
		.query<{ role: string; banned: number | null; banExpires: string | null }, [string]>(
			"SELECT role, banned, banExpires FROM user WHERE id = ?",
		)
		.get(session.user.id);
	if (!current || !isUserActive(current)) return null;
	return { ...session, user: { ...session.user, role: current.role } };
}

export async function requireRequestPermission(request: Request, permission: AppPermission) {
	const session = await requireRequestSession(request);
	if (!session) return { ok: false as const, response: unauthorizedResponse() };
	if (!hasPermission(session.user.role, permission)) {
		return {
			ok: false as const,
			response: privateJson(
				{ error: "Your role does not allow this action.", code: "forbidden" },
				{ status: 403 },
			),
		};
	}
	return { ok: true as const, session };
}

export function unauthorizedResponse(message = "Authentication required.") {
	return privateJson({ error: message }, { status: 401 });
}

export function authProvidersResponse() {
	return privateJson({
		providers: socialProviderAvailability,
	});
}
