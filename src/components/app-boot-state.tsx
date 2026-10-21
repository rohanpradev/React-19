export function AppBootState({ failed = false }: { failed?: boolean }) {
	return (
		<main className="boot-shell">
			<section className="boot-panel" aria-labelledby="boot-state-title">
				<p className="boot-kicker">React Systems Studio</p>
				<h1 id="boot-state-title" style={{ fontSize: "1.5rem", margin: 0 }}>
					{failed ? "The workspace could not start" : "Opening your workspace…"}
				</h1>
				{failed ? (
					<>
						<p role="alert">Check your connection, then reload to get the latest workspace.</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							style={{ padding: "0.6rem 1rem", font: "inherit", cursor: "pointer" }}
						>
							Reload workspace
						</button>
					</>
				) : (
					<p role="status">Loading the application and checking your session.</p>
				)}
			</section>
		</main>
	);
}
