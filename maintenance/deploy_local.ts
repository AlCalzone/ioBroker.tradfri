// tslint:disable:no-var-requires
/*
	Allows easier local debugging over SSH.
	Running `npm run deploy_local` updates remote adapter files
	and restarts the instance
*/

/*
	CONFIGURATION:
		- provide a deploy_password.json file in the local dir with contents
			{
				"host": "<HOSTNAME>",
				"username": "<USERNAME>",
				"password": "<PASSWORD>"
			}
		- specify which dirs and files should be uploaded
		- specify where the root dir is relative to this script
*/
const uploadDirs = ["admin", "build"];
const uploadFiles = ["package.json", "io-package.json", "main.js"];
const rootDir = "../";

// =========================
// CAN'T TOUCH THIS
// =========================

import * as nodeSSH from "node-ssh";
import * as path from "path";

const localRoot = path.resolve(__dirname, rootDir);

const ioPack = require(path.join(rootDir, "io-package.json"));
const ADAPTER_NAME = ioPack.common.name;

const ssh = new nodeSSH();
const sshConfig = require(path.join(__dirname, "deploy_password.json"));

const remoteRoot = `/opt/iobroker/node_modules/iobroker.${ADAPTER_NAME}`;

(async function main() {
	await ssh.connect(sshConfig);

	for (const dir of uploadDirs) {
		console.log(`cleaning ${dir} dir...`);
		await ssh.execCommand(`rm -rf ${path.join(remoteRoot, dir)}`);
		console.log(`uploading ${dir} dir...`);
		try {
			await ssh.putDirectory(path.join(localRoot, dir), path.join(remoteRoot, dir), {
				recursive: true,
				concurrency: 10,
				validate: (pathname) => {
					const basename = path.basename(pathname);
					if (basename.startsWith("deploy_")) return false;
					if (basename.endsWith("Thumbs.db")) return false;
					if (basename.endsWith(".map") && basename.indexOf(".bundle.") === -1) return false;
					if (basename.indexOf(".test.") > -1) return false;
					if (basename === "src") return false;
					return true;
				},
			});
		} catch (e) {
			console.error(e);
		}
	}
	for (const file of uploadFiles) {
		console.log(`uploading ${file}...`);
		await ssh.putFile(path.join(localRoot, file), path.join(remoteRoot, file));
	}

	// update in-mem adapter
	let execResult;
	console.log("updating in-mem adapter");
	execResult = await ssh.execCommand(`iobroker upload ${ADAPTER_NAME}`);
	console.log(execResult.stdout);
	console.log(execResult.stderr);
	if (process.argv.indexOf("--norestart") === -1) {
		execResult = await ssh.execCommand(`iobroker restart ${ADAPTER_NAME}`);
		console.log(execResult.stdout);
		console.log(execResult.stderr);
	}

	console.log("done");
	process.exit(0);
})();
