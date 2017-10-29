import * as fs from "fs";
import * as path from "path";
import { Global as _ } from "./global";
import { values } from "./object-polyfill";

/**
 * Fixes/updates/deletes existing adapter objects,
 * so they don't have to be deleted manually
 */
export async function fixAdapterObjects() {
	// read all objects, we'll filter them in the fixer functions
	const stateObjs = values(await _.$$(`${_.adapter.namespace}.*`, "state"));
	// const channelObjs = values(await _.$$(`${_.adapter.namespace}.*`, "channel"));
	// const deviceObjs = values(await _.$$(`${_.adapter.namespace}.*`, "device"));

	await fixBrightnessRange(stateObjs);
}

/**
 * In v0.5.4, the brightness range was changed from 0..254 to 0..100%
 */
async function fixBrightnessRange(stateObjs: ioBroker.Object[]) {
	const predicate = /(G|VG|L)\-\d+\.(lightbulb\.)?brightness$/;
	const fixableObjs = stateObjs.filter(o => predicate.test(o._id));
	for (const obj of fixableObjs) {
		const oldCommon = JSON.stringify(obj.common);
		const newCommon = JSON.stringify(Object.assign(Object.assign({}, obj.common), {
			name: "Brightness",
			min: 0,
			max: 100,
			unit: "%",
		}));
		if (oldCommon !== newCommon) {
			obj.common = JSON.parse(newCommon);
			await _.adapter.$setForeignObject(obj._id, obj);
		}
	}
}

// Workaround für unvollständige Adapter-Upgrades
export async function ensureInstanceObjects(): Promise<void> {
	// read io-package.json
	const ioPack = JSON.parse(
		fs.readFileSync(path.join(__dirname, "../../io-package.json"), "utf8"),
	);

	if (ioPack.instanceObjects == null || ioPack.instanceObjects.length === 0) return;

	// wait for all instance objects to be created
	const setObjects = ioPack.instanceObjects.map(
		obj => _.adapter.$setObjectNotExists(obj._id, obj),
	);
	await Promise.all(setObjects);
}
