import packageJson from "../../package.json";

const { dependencies, devDependencies } = packageJson;
const version = (range: string) => range.replace(/^[~^]/, "");

// Declared dependency baselines, shared by the documentation and learning UI.
export const stackVersions = {
	react: version(dependencies.react),
	router: version(dependencies["react-router"]),
	auth: version(dependencies["better-auth"]),
	drizzle: version(dependencies["drizzle-orm"]),
	biome: version(devDependencies["@biomejs/biome"]),
};
