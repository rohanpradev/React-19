// This command is the explicit local trust boundary for the first administrator.
// It never chooses a user by signup order, email domain, or provider profile.
const args = process.argv.slice(2);
if (args.length !== 2 || args[0] !== "--user-id" || !args[1]?.trim()) {
	throw new Error("Usage: bun run access:bootstrap --user-id <existing-user-id>");
}
const userId = args[1].trim();
const { sqlite } = await import("@/db");
try {
	const { runMigrations } = await import("@/db/migrations");
	const { createAccessService } = await import("@/server/access");
	runMigrations();
	const user = createAccessService(sqlite).bootstrapAdministrator(userId);
	console.log(
		`Administrator access granted to user ${user.id}. Sign in again to use the new role.`,
	);
} finally {
	sqlite.close();
}
