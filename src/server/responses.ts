/** Cookie-authenticated responses must never be stored by browsers or shared caches. */
export function privateResponse(response: Response) {
	const result = new Response(response.body, response);
	result.headers.set("cache-control", "no-store");
	result.headers.set("x-content-type-options", "nosniff");
	return result;
}

export function privateJson(body: unknown, init?: ResponseInit) {
	return privateResponse(Response.json(body, init));
}
