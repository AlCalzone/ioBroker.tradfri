// tslint:disable:no-var-requires
import * as fs from "fs";
import * as path from "path";
const semver = require("semver");

const rootDir = path.resolve(__dirname, "../");

const packPath = path.join(rootDir, "package.json");
const pack = require(packPath);
const ioPackPath = path.join(rootDir, "io-package.json");
const ioPack = require(ioPackPath);

function fail(reason: string) {
	console.error("");
	console.error(reason);
	console.error("");
	process.exit(1);
}

const newVersion = semver.clean(process.argv[2]);
if (newVersion == null) {
	fail(`no valid version string "${process.argv[2]}"`);
}

if (!semver.gt(newVersion, pack.version)) {
	fail(`new version ${newVersion} is NOT > than package.json version ${pack.version}`);
}
if (!semver.gt(newVersion, ioPack.common.version)) {
	fail(`new version ${newVersion} is NOT > than io-package.json version ${ioPack.common.version}`);
}

console.log(`updating package.json from ${pack.version} to ${newVersion}`);
pack.version = newVersion;
fs.writeFileSync(packPath, JSON.stringify(pack, null, 2));

console.log(`updating io-package.json from ${ioPack.common.version} to ${newVersion}`);
ioPack.common.version = newVersion;
fs.writeFileSync(ioPackPath, JSON.stringify(ioPack, null, 4));

console.log("done!");
process.exit(0);
