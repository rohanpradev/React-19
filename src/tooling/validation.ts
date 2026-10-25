import path from "node:path";

export type ValidationStage = {
	id: string;
	label: string;
	command: string[];
	timeoutMs: number;
	requires?: string[];
};

export type StageResult = {
	id: string;
	label: string;
	status: "passed" | "failed" | "timed-out" | "skipped" | "cancelled";
	durationMs: number;
	exitCode?: number;
	reason?: string;
};

export function createValidationPlan(options: {
	quick: boolean;
	audit: boolean;
}): ValidationStage[] {
	const script = (id: string, label: string, timeoutMs = 120_000): ValidationStage => ({
		id,
		label,
		command: [process.execPath, "--no-env-file", "run", id],
		timeoutMs,
	});
	return [
		script("format:check", "Bun formatting"),
		script("check", "Biome lint and imports"),
		script("typecheck", "Bun type check"),
		...(!options.quick ? [script("typecheck:diagnostics", "TypeScript compiler")] : []),
		script("db:check", "Migration integrity"),
		script("test", "Regression tests"),
		...(!options.quick
			? [
					script("build", "Production build", 180_000),
					{
						...script("test:production", "Production HTTP contracts", 60_000),
						requires: ["build"],
					},
				]
			: []),
		...(options.audit ? [script("audit", "Dependency security audit")] : []),
	];
}

export async function executeStage(
	stage: ValidationStage,
	options: { cwd: string; signal?: AbortSignal; quiet?: boolean },
): Promise<StageResult> {
	const startedAt = performance.now();
	const deadline = AbortSignal.timeout(stage.timeoutMs);
	const signal = options.signal ? AbortSignal.any([options.signal, deadline]) : deadline;
	try {
		const child = Bun.spawn(stage.command, {
			cwd: options.cwd,
			stdin: "ignore",
			stdout: options.quiet ? "ignore" : "inherit",
			stderr: options.quiet ? "ignore" : "inherit",
			signal,
			killSignal: "SIGKILL",
		});
		const exitCode = await child.exited;
		const status = options.signal?.aborted
			? "cancelled"
			: deadline.aborted
				? "timed-out"
				: exitCode === 0
					? "passed"
					: "failed";
		return {
			id: stage.id,
			label: stage.label,
			status,
			exitCode,
			durationMs: Math.round(performance.now() - startedAt),
			...(status === "timed-out" ? { reason: `Exceeded ${stage.timeoutMs}ms deadline.` } : {}),
		};
	} catch (error) {
		return {
			id: stage.id,
			label: stage.label,
			status: options.signal?.aborted ? "cancelled" : "failed",
			durationMs: Math.round(performance.now() - startedAt),
			reason: error instanceof Error ? error.message : String(error),
		};
	}
}

export async function runValidationStages(
	stages: ValidationStage[],
	options: {
		cwd: string;
		signal?: AbortSignal;
		quiet?: boolean;
		onStage?: (stage: ValidationStage) => void;
	},
): Promise<StageResult[]> {
	const results: StageResult[] = [];
	for (const stage of stages) {
		const unmet = stage.requires?.filter(
			(id) => !results.some((result) => result.id === id && result.status === "passed"),
		);
		if (options.signal?.aborted || unmet?.length) {
			results.push({
				id: stage.id,
				label: stage.label,
				status: options.signal?.aborted ? "cancelled" : "skipped",
				durationMs: 0,
				reason: options.signal?.aborted
					? "Validation interrupted."
					: `Requires a passing ${unmet?.join(", ")}.`,
			});
			continue;
		}
		options.onStage?.(stage);
		results.push(await executeStage(stage, options));
	}
	return results;
}

export const projectRoot = path.resolve(import.meta.dir, "../..");
