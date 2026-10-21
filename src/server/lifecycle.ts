type StoppableServer = { stop: (closeActiveConnections?: boolean) => Promise<void> };

/** Stop accepting work, drain requests, then release resources. Repeated signals share one drain. */
export function createGracefulShutdown(
	server: StoppableServer,
	afterStop: () => void | Promise<void>,
	timeoutMs = 10_000,
) {
	let shutdown: Promise<void> | undefined;
	return () => {
		shutdown ??= drain();
		return shutdown;
	};

	async function drain() {
		let timer: ReturnType<typeof setTimeout> | undefined;
		const stopped = server.stop();
		const deadline = new Promise<void>((resolve, reject) => {
			timer = setTimeout(() => {
				void server.stop(true).then(resolve, reject);
			}, timeoutMs);
		});
		try {
			await Promise.race([stopped, deadline]);
			clearTimeout(timer);
			await afterStop();
		} finally {
			clearTimeout(timer);
		}
	}
}
