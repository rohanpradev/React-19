import { sqlite } from "./db";
import { startServer } from "./server";
import { createGracefulShutdown } from "./server/lifecycle";

const server = startServer();
const shutdown = createGracefulShutdown(server, () => sqlite.close());

for (const signal of ["SIGINT", "SIGTERM"] as const) {
	process.on(signal, () => {
		console.log(`Received ${signal}; draining active requests.`);
		void shutdown().then(
			() => process.exit(0),
			(error: unknown) => {
				console.error("Server shutdown failed:", error);
				process.exit(1);
			},
		);
	});
}
