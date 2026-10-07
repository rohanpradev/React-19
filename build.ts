#!/usr/bin/env bun
import { rm } from "node:fs/promises";
import path from "node:path";

import plugin from "bun-plugin-tailwind";

// Keep executable server output outside the directory exposed by the HTTP handler.
const projectRoot = import.meta.dir;
const outdir = path.resolve(projectRoot, "dist");
if (path.dirname(outdir) !== projectRoot || path.basename(outdir) !== "dist") {
	throw new Error("Build output must be the project's dist directory.");
}
if (process.argv.length > 2) {
	throw new Error(
		"This build uses fixed browser/server targets. Run bun run build without options.",
	);
}
await rm(outdir, { recursive: true, force: true });

const shared = {
	minify: true,
	splitting: true,
	sourcemap: "none",
	define: { "process.env.NODE_ENV": JSON.stringify("production") },
} satisfies Partial<Bun.BuildConfig>;

const browser = await Bun.build({
	...shared,
	entrypoints: [path.join(projectRoot, "src/index.html")],
	outdir: path.join(outdir, "public"),
	target: "browser",
	publicPath: "/",
	plugins: [plugin],
});
if (!browser.success) throw new AggregateError(browser.logs, "Browser build failed.");

const server = await Bun.build({
	...shared,
	entrypoints: [path.join(projectRoot, "src/production.ts")],
	outdir,
	target: "bun",
	naming: { entry: "index.[ext]", chunk: "[name]-[hash].[ext]", asset: "[name]-[hash].[ext]" },
});
if (!server.success) throw new AggregateError(server.logs, "Server build failed.");
console.log(
	`Built ${browser.outputs.length} public assets and ${server.outputs.length} server files.`,
);
