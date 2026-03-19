#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import path from "node:path";
import plugin from "bun-plugin-tailwind";

type CliConfig = Partial<Bun.BuildConfig> & Record<string, unknown>;

const helpText = `
  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --sourcemap <type>       Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (for example --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --sourcemap=linked --external=react,react-dom
`;

if (process.argv.includes("--help") || process.argv.includes("-h")) {
	console.log(helpText);
	process.exit(0);
}

const toCamelCase = (value: string): string =>
	value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

const parseValue = (value: string): unknown => {
	if (value === "true") {
		return true;
	}

	if (value === "false") {
		return false;
	}

	if (/^\d+$/.test(value)) {
		return Number.parseInt(value, 10);
	}

	if (/^\d*\.\d+$/.test(value)) {
		return Number.parseFloat(value);
	}

	if (value.includes(",")) {
		return value.split(",").map((entry) => entry.trim());
	}

	return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

function parseArgs(): CliConfig {
	const config: CliConfig = {};
	const args = process.argv.slice(2);

	for (let index = 0; index < args.length; index++) {
		const arg = args[index];
		if (arg === undefined || !arg.startsWith("--")) {
			continue;
		}

		if (arg.startsWith("--no-")) {
			config[toCamelCase(arg.slice(5))] = false;
			continue;
		}

		const nextArg = args[index + 1];
		const isBooleanFlag =
			!arg.includes("=") &&
			(index === args.length - 1 ||
				nextArg === undefined ||
				nextArg.startsWith("--"));

		if (isBooleanFlag) {
			config[toCamelCase(arg.slice(2))] = true;
			continue;
		}

		let key = "";
		let rawValue = "";

		if (arg.includes("=")) {
			const [nextKey = "", nextValue = ""] = arg.slice(2).split("=", 2);
			key = nextKey;
			rawValue = nextValue;
		} else {
			key = arg.slice(2);
			rawValue = args[++index] ?? "";
		}

		const normalizedKey = toCamelCase(key);

		if (normalizedKey.includes(".")) {
			const [parentKey, childKey] = normalizedKey.split(".", 2);
			if (parentKey === undefined || childKey === undefined) {
				continue;
			}

			const parentValue = config[parentKey];
			const parentObject = isRecord(parentValue) ? parentValue : {};
			parentObject[childKey] = parseValue(rawValue);
			config[parentKey] = parentObject;
			continue;
		}

		config[normalizedKey] = parseValue(rawValue);
	}

	return config;
}

const formatFileSize = (bytes: number): string => {
	const units = ["B", "KB", "MB", "GB"] as const;
	let size = bytes;
	let unitIndex = 0;

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024;
		unitIndex++;
	}

	const unit = units[unitIndex] ?? "GB";
	return `${size.toFixed(2)} ${unit}`;
};

console.log("\nStarting build process...\n");

const cliConfig = parseArgs();
const outdir =
	typeof cliConfig.outdir === "string"
		? cliConfig.outdir
		: path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
	console.log(`Cleaning previous build at ${outdir}`);
	await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
	.map((entrypoint) => path.resolve("src", entrypoint))
	.filter((entrypoint) => !entrypoint.includes("node_modules"));

console.log(
	`Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`,
);

const buildConfig: Bun.BuildConfig = {
	entrypoints,
	outdir,
	plugins: [plugin],
	minify: true,
	target: "browser",
	sourcemap: "linked",
	define: {
		"process.env.NODE_ENV": JSON.stringify("production"),
	},
	...(cliConfig as Partial<Bun.BuildConfig>),
};

const result = await Bun.build(buildConfig);
const end = performance.now();

const outputTable = result.outputs.map((output) => ({
	File: path.relative(process.cwd(), output.path),
	Type: output.kind,
	Size: formatFileSize(output.size),
}));

console.table(outputTable);
console.log(`\nBuild completed in ${(end - start).toFixed(2)}ms\n`);
