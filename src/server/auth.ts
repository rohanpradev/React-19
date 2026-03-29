import { auth } from "@/auth/server";
import { socialProviderAvailability } from "@/auth/social-providers";

export async function getRequestSession(request: Request) {
	return auth.api.getSession({
		headers: request.headers,
	});
}

export async function requireRequestSession(request: Request) {
	const session = await getRequestSession(request);

	if (!session?.session || !session.user) {
		return null;
	}

	return session;
}

export function unauthorizedResponse(message = "Authentication required.") {
	return Response.json({ error: message }, { status: 401 });
}

export function authProvidersResponse() {
	return Response.json({
		providers: socialProviderAvailability,
	});
}
