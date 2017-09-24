/*
	Allows easier local debugging over SSH.
	Running `npm run deploy_local` updates remote adapter files
	and restarts the instance
*/

import * as fs from "fs";
import * as path from "path";
import * as nodeSSH from "node-ssh";

const ssh = new nodeSSH();

/*
	CONFIGURATION:
		- enter adapter name behind ADAPTER_NAME
		- provide a deploy_password.json file in the project root with contents
			{
				"host": "<HOSTNAME>",
				"username": "<USERNAME>",
				"password": "<PASSWORD>"
			}
*/
const ADAPTER_NAME = "tradfri";
const sshConfig = require("../deploy_password.json");


const localRoot = path.resolve(__dirname, "../");
const remoteRoot = `/opt/iobroker/node_modules/iobroker.${ADAPTER_NAME}`;


(async function main() {
	await ssh.connect(sshConfig);

	const uploadDirs = ["admin", "build"];
	for (const dir of uploadDirs) {
		console.log(`uploading ${dir} dir...`);
		await ssh.putDirectory(path.join(localRoot, dir), path.join(remoteRoot, dir), {
			recursive: true,
			concurrency: 10,
			validate: (pathname) => {
				const basename = path.basename(pathname);
				return !basename.startsWith("deploy_");
			}
		});
	}
	const uploadFiles = ["package.json", "io-package.json", "main.js"];
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
	execResult = await ssh.execCommand(`iobroker restart ${ADAPTER_NAME}`);
	console.log(execResult.stdout);
	console.log(execResult.stderr);

	console.log("done");
	process.exit(0);
})();