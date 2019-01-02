import { values } from "alcalzone-shared/objects";
import { Global as _ } from "./global";

import { instanceObjects as _instanceObjects } from "../../io-package.json";
const instanceObjects = _instanceObjects as ioBroker.Object[];

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
	await fixAuthenticationObjects();
	await fixBrightnessRole(stateObjs);
}

/**
 * In v0.5.4, the brightness range was changed from 0..254 to 0..100%
 */
async function fixBrightnessRange(stateObjs: ioBroker.Object[]) {
	const predicate = /(G|VG|L)\-\d+\.(lightbulb\.)?brightness$/;
	const fixableObjs = stateObjs.filter(o => predicate.test(o._id));
	for (const obj of fixableObjs) {
		const oldCommon = JSON.stringify(obj.common);
		const newCommon = JSON.stringify({
			name: "Brightness",
			...obj.common,
			min: 0,
			max: 100,
			unit: "%",
		});
		if (oldCommon !== newCommon) {
			obj.common = JSON.parse(newCommon);
			await _.adapter.setForeignObjectAsync(obj._id, obj);
		}
	}
}

/**
 * In v0.6.0, the authentication procedure was changed to no longer
 * store the security code.
 * From v0.6.0-beta2 to -beta3, the info.identity object was removed in favor of config properties.
 */
async function fixAuthenticationObjects() {
	const identityObj = await _.adapter.getObjectAsync("info.identity");
	if (identityObj != null) {
		await _.adapter.delState("info.identity");
		await _.adapter.delObject("info.identity");
	}
}

/**
 * In v1.0.5, the brightness role was changed from "light.dimmer" to "level.dimmer"
 */
async function fixBrightnessRole(stateObjs: ioBroker.Object[]) {
	const predicate = /(G|VG|L)\-\d+\.(lightbulb\.)?brightness$/;
	const fixableObjs = stateObjs.filter(o => predicate.test(o._id));
	for (const obj of fixableObjs) {
		const oldCommon = JSON.stringify(obj.common);
		const newCommon = JSON.stringify({
			...obj.common,
			role: "level.dimmer",
		});
		if (oldCommon !== newCommon) {
			obj.common = JSON.parse(newCommon);
			await _.adapter.setForeignObjectAsync(obj._id, obj);
		}
	}
}

// Workaround für unvollständige Adapter-Upgrades
export async function ensureInstanceObjects(): Promise<void> {
	if (instanceObjects == null || instanceObjects.length === 0) return;

	// wait for all instance objects to be created
	const setObjects = instanceObjects.map(
		obj => _.adapter.setObjectNotExistsAsync(obj._id, obj),
	);
	await Promise.all(setObjects);
}
