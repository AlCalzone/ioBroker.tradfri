/** Build script to use esbuild without specifying 1000 CLI options */
const { build, cliopts } = require("estrella");
const glob = require("tiny-glob");

const [opts, args] = cliopts.parse(
	["react", "Build React sources"],
	["typescript", "Build TypeScript sources"]
);

if (opts.react) {
	(async () => {
		await build({
			entryPoints: ["./admin/src/index"],
			tsconfig: "./admin/tsconfig.json",
			bundle: true,
			minify: !cliopts.watch,
			outdir: "admin/build",
			sourcemap: true,
			logLevel: "info",
			define: {
				"process.env.NODE_ENV": cliopts.watch
					? '"development"'
					: '"production"',
			},
		});
	})().catch(() => process.exit(1));
}

if (opts.typescript) {
	(async () => {
		let entryPoints = await glob("./src/**/*.ts");
		entryPoints = entryPoints
			.filter((ep) => !ep.endsWith(".d.ts"))
			.filter((ep) => !ep.endsWith(".test.ts"));
		await build({
			entryPoints,
			outdir: "build",
			bundle: false,
			minify: false,
			sourcemap: true,
			logLevel: "info",
			platform: "node",
			format: "cjs",
			target: "node10",
		});
	})().catch(() => process.exit(1));
}
