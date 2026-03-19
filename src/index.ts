import { serve } from "bun";
import { initializeDatabase } from "./db/init";
import index from "./index.html";
import { listCustomers } from "./server/customers";

initializeDatabase();

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

		// Serve index.html for all unmatched routes.
		"/*": index,
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`Server running at ${server.url}`);
