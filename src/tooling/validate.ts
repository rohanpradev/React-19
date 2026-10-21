import packageJson from "../../package.json";
import { createValidationPlan, projectRoot, runValidationStages } from "./validation";

const args = new Set(process.argv.slice(2));
const supported = new Set(["--quick", "--audit", "--list"]);
for (const arg of args) {
	if (!supported.has(arg)) throw new Error(`Unknown validation option: ${arg}`);
}
if (!Bun.semver.satisfies(Bun.version, packageJson.engines.bun)) {
	throw new Error(`Bun ${packageJson.engines.bun} is required; running ${Bun.version}.`);
}
const mode = args.has("--quick") ? "quick" : "full";
const stages = createValidationPlan({ quick: mode === "quick", audit: args.has("--audit") });
if (args.has("--list")) {
	for (const stage of stages) console.log(`${stage.label}: bun run ${stage.id}`);
} else {
	const controller = new AbortController();
	let interruptedCode = 0;
	const interrupt = (signal: NodeJS.Signals) => {
		interruptedCode = signal === "SIGINT" ? 130 : 143;
		controller.abort();
	};
	process.on("SIGINT", interrupt);
	process.on("SIGTERM", interrupt);
	const startedAt = new Date().toISOString();
	try {
		const results = await runValidationStages(stages, {
			cwd: projectRoot,
			signal: controller.signal,
			onStage: (stage) => console.log(`\n▶ ${stage.label}`),
		});
		const passed = results.every((result) => result.status === "passed");
		const report = {
			schemaVersion: 1,
			mode,
			bun: Bun.version,
			startedAt,
			completedAt: new Date().toISOString(),
			passed,
			results,
		};
		const reportPath = `${projectRoot}/.cache/validation/latest.json`;
		await Bun.write(reportPath, `${JSON.stringify(report, null, 2)}\n`);
		console.log("\nValidation results");
		for (const result of results) {
			console.log(
				`${result.status.padEnd(10)} ${result.label} (${(result.durationMs / 1000).toFixed(2)}s)${result.reason ? ` — ${result.reason}` : ""}`,
			);
		}
		console.log("Report: .cache/validation/latest.json");
		process.exitCode = interruptedCode || (passed ? 0 : 1);
	} finally {
		process.off("SIGINT", interrupt);
		process.off("SIGTERM", interrupt);
	}
}
