import { serve } from "bun";
import { initializeDatabase } from "./db/init";
import index from "./index.html";
import { autocompleteCustomers, listCustomers } from "./server/customers";

initializeDatabase();
const isDevelopment = process.env.NODE_ENV !== "production";

const server = serve({
	routes: {
		"/api/hello": {
			async GET(_req) {
				return Response.json({
					message: "Hello, world!",
					method: "GET",
				});
			},
			async PUT(_req) {
				return Response.json({
					message: "Hello, world!",
					method: "PUT",
				});
			},
		},

		"/api/hello/:name": async (req) => {
			const name = req.params.name;
			return Response.json({
				message: `Hello, ${name}!`,
			});
		},

		"/api/customers": {
			GET(req) {
				return Response.json(listCustomers(req));
			},
		},

		"/api/customers/autocomplete": {
			GET(req) {
				return Response.json(autocompleteCustomers(req));
			},
		},

		// Serve index.html for all unmatched routes.
		"/*": index,
	},

	development: isDevelopment
		? {
				// Enable browser hot reloading in development
				hmr: true,

				// Echo console logs from the browser to the server
				console: true,
			}
		: false,
});

console.log(`Server running at ${server.url}`);
