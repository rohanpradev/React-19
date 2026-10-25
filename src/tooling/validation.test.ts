import { expect, test } from "bun:test";

import { createValidationPlan, executeStage, projectRoot, runValidationStages } from "./validation";

const command = (id: string, source: string) => ({
	id,
	label: id,
	command: [process.execPath, "--no-env-file", "--eval", source],
	timeoutMs: 2_000,
});

test("failed builds skip the production probe while independent checks still run", async () => {
	const results = await runValidationStages(
		[
			command("build", "process.exit(7)"),
			{ ...command("production", "process.exit(0)"), requires: ["build"] },
			command("audit", "process.exit(0)"),
		],
		{ cwd: projectRoot, quiet: true },
	);
	expect(results.map((result) => result.status)).toEqual(["failed", "skipped", "passed"]);
	expect(results[0]?.exitCode).toBe(7);
	expect(results[1]?.reason).toContain("build");
});

test("a stuck subprocess is terminated and reported as a timeout", async () => {
	const result = await executeStage(
		{ ...command("stuck", "setInterval(() => {}, 1000)"), timeoutMs: 100 },
		{ cwd: projectRoot, quiet: true },
	);
	expect(result.status).toBe("timed-out");
	expect(result.durationMs).toBeLessThan(2_000);
});

test("interrupting validation cancels work instead of starting later checks", async () => {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 100);
	try {
		const results = await runValidationStages(
			[command("active", "setInterval(() => {}, 1000)"), command("later", "process.exit(0)")],
			{ cwd: projectRoot, quiet: true, signal: controller.signal },
		);
		expect(results.map((result) => result.status)).toEqual(["cancelled", "cancelled"]);
	} finally {
		clearTimeout(timer);
	}
});

test("quick validation excludes production and network work; CI includes the audit", () => {
	const quick = createValidationPlan({ quick: true, audit: false }).map((stage) => stage.id);
	expect(quick).toEqual(["format:check", "check", "typecheck", "db:check", "test"]);
	const full = createValidationPlan({ quick: false, audit: true });
	expect(full.find((stage) => stage.id === "test:production")?.requires).toEqual(["build"]);
	expect(full.at(-1)?.id).toBe("audit");
});
