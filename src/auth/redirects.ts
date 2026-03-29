const DEFAULT_AUTH_REDIRECT_PATH = "/react-19";

export function getDefaultAuthRedirectPath() {
	return DEFAULT_AUTH_REDIRECT_PATH;
}

export function sanitizeRedirectPath(value: string | null | undefined) {
	if (!value?.startsWith("/") || value.startsWith("//")) {
		return DEFAULT_AUTH_REDIRECT_PATH;
	}

	if (value.startsWith("/api/auth")) {
		return DEFAULT_AUTH_REDIRECT_PATH;
	}

	return value;
}

export function buildAuthHref(next: string | null | undefined) {
	const safeNext = sanitizeRedirectPath(next);
	return `/auth?next=${encodeURIComponent(safeNext)}`;
}

export function getCurrentAppPath() {
	if (typeof window === "undefined") {
		return DEFAULT_AUTH_REDIRECT_PATH;
	}

	return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function redirectToAuth(next = getCurrentAppPath()) {
	if (typeof window === "undefined") {
		return;
	}

	window.location.assign(buildAuthHref(next));
}
