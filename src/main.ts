// tslint:disable:object-literal-key-quotes

// Eigene Module laden
import { CoapClient as coap } from "node-coap-client";
import coapEndpoints from "./ipso/endpoints";
import { except } from "./lib/array-extensions";
import { ExtendedAdapter, Global as _ } from "./lib/global";
import { dig, entries, filter, values } from "./lib/object-polyfill";
import { str2regex } from "./lib/str2regex";

// Datentypen laden
import Accessory from "./ipso/accessory";
import { accessoryTypes } from "./ipso/accessoryTypes";

// Adapter-Utils laden
import utils from "./lib/utils";

// Konvertierungsfunktionen
import conversions from "./lib/conversions";

const customStateSubscriptions: {
	subscriptions: { [id: string]: { pattern: RegExp, callback: (id: string, state: ioBroker.State) => void } },
	counter: number,
} = {
		subscriptions: {},
		counter: 0,
	};
const customObjectSubscriptions: {
	subscriptions: { [id: string]: { pattern: RegExp, callback: (id: string, obj: ioBroker.Object) => void } },
	counter: number,
} = {
		subscriptions: {},
		counter: 0,
	};

// dictionary of COAP observers
const observers = [];
// dictionary of known devices
const devices = {};
// dictionary of ioBroker objects
const objects: { [objId: string]: ioBroker.Object } = {};

// the base of all requests
let requestBase;

// Adapter-Objekt erstellen
let adapter: ExtendedAdapter = utils.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: () => {
		// Adapter-Instanz global machen
		adapter = _.extend(adapter);
		_.adapter = adapter;

		// redirect console output
		// console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
		// console.error = (msg) => adapter.log.error("STDERR > " + msg);

		// Eigene Objekte/States beobachten
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

		// Custom subscriptions erlauben
		_.subscribeStates = subscribeStates;
		_.unsubscribeStates = unsubscribeStates;
		_.subscribeObjects = subscribeObjects;
		_.unsubscribeObjects = unsubscribeObjects;

		// initialize CoAP client
		coap.setSecurityParams(adapter.config.host, {
			psk: { "Client_identity": adapter.config.securityCode },
		});
		requestBase = `coaps://${adapter.config.host}:5684/`;
		// TODO: replace our coapClient with the imported one

		// TODO: load known devices from ioBroker into <devices> & <objects>
		observeDevices();

	},

	message: (obj) => {
		// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
		if (typeof obj === "object" && obj.message) {
			if (obj.command === "send") {
				// e.g. send email or pushover or whatever
				// console.log('send command');

				// Send response in callback if required
				if (obj.callback) adapter.sendTo(obj.from, obj.command, "Message received", obj.callback);
			}
		}
	},

	objectChange: (id, obj) => {
		_.log(`{{blue}} object with id ${id} updated`, { level: _.loglevels.ridiculous });
		if (id.startsWith(adapter.namespace)) {
			// this is our own object, remember it!
			objects[id] = obj;
		}

		// Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
		try {
			for (const sub of values(customObjectSubscriptions.subscriptions)) {
				if (sub && sub.pattern && sub.callback) {
					// Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
					if (sub.pattern.test(id)) sub.callback(id, obj);
				}
			}
		} catch (e) {
			_.log("error handling custom sub: " + e);
		}

	},

	stateChange: (id, state) => {
		_.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`, { level: _.loglevels.ridiculous });
		if (!state.ack && id.startsWith(adapter.namespace)) {
			// our own state was changed from within ioBroker, react to it

			const stateObj = objects[id];
			if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path)) return;

			// get "official" value for the parent object
			const devId = getAccessoryId(id);
			if (devId) {
				// get the ioBroker object
				const dev = objects[devId];
				//// read the instanceId and get a reference value
				const accessory = devices[dev.native.instanceId];

				// for now: handle changes on a case by case basis
				// everything else is too complicated for now
				let val = state.val;
				if (_.isdef(stateObj.common.min)) val = Math.max(stateObj.common.min, val);
				if (_.isdef(stateObj.common.max)) val = Math.min(stateObj.common.max, val);

				// TODO: find a way to construct these from existing accessory objects
				let payload = null;
				if (id.endsWith(".lightbulb.state")) {
					payload = { "3311": [{ "5850": (val ? 1 : 0)}] };
				} else if (id.endsWith(".lightbulb.brightness")) {
					payload = { "3311": [{ "5851": val, "5712": 5  }] };
				} else if (id.endsWith(".lightbulb.color")) {
					const colorX = conversions.color("out", state.val);
					payload = { "3311": [{ "5709": colorX, "5710": 27000, "5712": 5 }] };
				}

				payload = JSON.stringify(payload);
				_.log("sending payload: " + payload, { level: _.loglevels.ridiculous });

				payload = Buffer.from(payload);
				coap.request(
					`${requestBase}${coapEndpoints.devices}/${dev.native.instanceId}`, "put", payload,
				);

			}
		}

		// Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
		try {
			for (const sub of values(customStateSubscriptions.subscriptions)) {
				if (sub && sub.pattern && sub.callback) {
					// Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
					if (sub.pattern.test(id)) sub.callback(id, state);
				}
			}
		} catch (e) {
			_.log("error handling custom sub: " + e);
		}

	},

	unload: (callback) => {
		// is called when adapter shuts down - callback has to be called under any circumstances!
		try {
			// stop all observers
			for (const url of observers) {
				coap.stopObserving(url);
			}
			callback();
		} catch (e) {
			callback();
		}
	},
}) as ExtendedAdapter;

// ==================================
// manage devices

function observeDevices() {
	const allDevicesUrl = `${requestBase}${coapEndpoints.devices}`;
	if (observers.indexOf(allDevicesUrl) === -1) {
		observers.push(allDevicesUrl);
		coap.observe(allDevicesUrl, "get", coapCb_getAllDevices);
	}
}

// gets called whenever "get /15001" updates
function coapCb_getAllDevices(response) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getAllDevices.`, { severity: _.severity.error });
		return;
	}
	const newDevices = parsePayload(response);

	_.log(`got all devices: ${JSON.stringify(newDevices)}`);

	// get old keys as int array
	const oldKeys = Object.keys(devices).map(k => +k).sort();
	// get new keys as int array
	const newKeys = newDevices.sort();
	// translate that into added and removed devices
	const addedKeys = except(newKeys, oldKeys);
	_.log(`adding devices with keys ${JSON.stringify(addedKeys)}`, { level: _.loglevels.ridiculous });

	addedKeys.forEach(id => {
		const observerUrl = `${requestBase}${coapEndpoints.devices}/${id}`;
		if (observers.indexOf(observerUrl) > -1) return;

		// make a dummy object, we'll be filling that one later
		devices[id] = {};
		// start observing
		coap.observe(
			observerUrl, "get",
			(resp) => coap_getDevice_cb(id, resp),
		);
		observers.push(observerUrl);
	});

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing devices with keys ${JSON.stringify(removedKeys)}`, { level: _.loglevels.ridiculous });
	removedKeys.forEach(id => {
		// remove device from dictionary
		if (devices.hasOwnProperty(id)) delete devices[id];

		// remove observer
		const observerUrl = `${requestBase}${coapEndpoints.devices}/${id}`;
		const index = observers.indexOf(observerUrl);
		if (index === -1) return;

		coap.stopObserving(observerUrl);
		observers.splice(index, 1);

		// TODO: delete ioBroker device
	});

}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(instanceId, response) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getDevice(${instanceId}).`, { severity: _.severity.error });
		return;
	}
	const result = parsePayload(response);
	// parse device info
	const accessory = new Accessory(result);
	// remember the device object, so we can later use it as a reference for updates
	devices[instanceId] = accessory;
	// create ioBroker device
	extendDevice(accessory);
}

function getAccessoryId(stateId) {
	const match = /^tradfri\.\d+\.[\w\-\d]+/.exec(stateId);
	if (match) return match[0];
}

function calcObjId(accessory) {
	const prefix = (() => {
		switch (accessory.type) {
			case accessoryTypes.remote:
				return "RC";
			case accessoryTypes.lightbulb:
				return "L";
			default:
				_.log("unknown accessory type " + accessory.type);
				return "XYZ";
		}
	})();
	return `${adapter.namespace}.${prefix}-${accessory.instanceId}`;
}

// finds the property value for <accessory> as defined in <propPath>
function readPropertyValue(accessory, propPath) {
	// if path starts with "__convert:", use a custom conversion function
	if (propPath.startsWith("__convert:")) {
		const pathParts = propPath.substr("__convert:".length).split(",");
		try {
			const fnName = pathParts[0];
			const path = pathParts[1];
			// find initial value on the object
			const value = dig(accessory, path);
			// and convert it
			return conversions[fnName]("in", value);
		} catch (e) {
			_.log("invalid path definition ${propPath}");
		}
	} else {
		return dig(accessory, propPath);
	}
}

// creates or edits an existing <device>-object for an accessory
function extendDevice(accessory) {
	const objId = calcObjId(accessory);

	if (_.isdef(objects[objId])) {
		// check if we need to edit the existing object
		const devObj = objects[objId];
		let changed = false;
		// update common part if neccessary
		const newCommon = {
			name: accessory.name,
		};
		if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
			devObj.common = newCommon;
			changed = true;
		}
		const newNative = {
			instanceId: accessory.instanceId,
			manufacturer: accessory.deviceInfo.manufacturer,
			firmwareVersion: accessory.deviceInfo.firmwareVersion,
		};
		// update native part if neccessary
		if (JSON.stringify(devObj.native) !== JSON.stringify(newNative)) {
			devObj.native = newNative;
			changed = true;
		}
		if (changed) adapter.extendObject(objId, devObj);

		// ====

		// from here we can update the states
		// filter out the ones belonging to this device with a property path
		const stateObjs = filter(
			objects,
			obj => obj._id.startsWith(objId) && obj.native && obj.native.path,
		);
		// for each property try to update the value
		for (const [id, obj] of entries(stateObjs)) {
			try {
				// Object could have a default value, find it
				let newValue = readPropertyValue(accessory, obj.native.path);
				if (obj.type === "state" && obj.common.type === "boolean") {
					// fix bool values
					newValue = newValue === 1 || newValue === "true" || newValue === "on";
				}
				adapter.setState(id, newValue, true);
			} catch (e) {/* skip this value */}
		}

	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "device",
			common: {
				name: accessory.name,
			},
			native: {
				instanceId: accessory.instanceId,
				manufacturer: accessory.deviceInfo.manufacturer,
				firmwareVersion: accessory.deviceInfo.firmwareVersion,
			},
		};
		adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		const stateObjs = {
			alive: { // alive state
				_id: `${objId}.alive`,
				type: "state",
				common: {
					name: "device alive",
					read: true,
					write: false,
					type: "boolean",
					role: "indicator.alive",
					desc: "indicates if the device is currently alive and connected to the gateway",
				},
				native: {
					path: "alive",
				},
			},
			lastSeen: { // last seen state
				_id: `${objId}.lastSeen`,
				type: "state",
				common: {
					name: "last seen timestamp",
					read: true,
					write: false,
					type: "number",
					role: "indicator.lastSeen",
					desc: "indicates when the device has last been seen by the gateway",
				},
				native: {
					path: "lastSeen",
				},
			},
		};

		if (accessory.type === accessoryTypes.lightbulb) {
			// stateObjs["lightbulb.color"] = {
			// 	_id: `${objId}.lightbulb.color`,
			// 	type: "state",
			// 	common: {
			// 		name: "RGB color",
			// 		read: true, // TODO: check
			// 		write: false, // TODO: check
			// 		type: "string",
			// 		role: "level.color.rgb",
			// 		desc: "hex representation of the lightbulb color"
			// 	},
			// 	native: {
			// 		path: "lightList.[0].color"
			// 	}
			// };
			stateObjs["lightbulb.color"] = {
				_id: `${objId}.lightbulb.color`,
				type: "state",
				common: {
					name: "color temperature of the lightbulb",
					read: true, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 100,
					unit: "%",
					type: "number",
					role: "level.color.temperature",
					desc: "range: 0% = cold, 100% = warm",
				},
				native: {
					path: "__convert:color,lightList.[0].colorX",
				},
			};
			// stateObjs["lightbulb.colorX"] = {
			// 	_id: `${objId}.lightbulb.colorX`,
			// 	type: "state",
			// 	common: {
			// 		name: "CIE 1931 x coordinate",
			// 		read: true, // TODO: check
			// 		write: true, // TODO: check
			// 		min: 24930,
			// 		max: 33135,
			// 		type: "number",
			// 		role: "level.color.temperature",
			// 		desc: "x coordinate of the color temperature in the CIE 1931 color space"
			// 	},
			// 	native: {
			// 		path: "lightList.[0].colorX"
			// 	}
			// };
			// stateObjs["lightbulb.colorY"] = {
			// 	_id: `${objId}.lightbulb.colorY`,
			// 	type: "state",
			// 	common: {
			// 		name: "CIE 1931 y coordinate",
			// 		read: true, // TODO: check
			// 		write: true, // TODO: check
			// 		min: 24694,
			// 		max: 27211,
			// 		type: "number",
			// 		role: "level.color.temperature",
			// 		desc: "y coordinate of the color temperature in the CIE 1931 color space"
			// 	},
			// 	native: {
			// 		path: "lightList.[0].colorY"
			// 	}
			// };
			stateObjs["lightbulb.brightness"] = {
				_id: `${objId}.lightbulb.brightness`,
				type: "state",
				common: {
					name: "brightness",
					read: true, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 254,
					type: "number",
					role: "level",
					desc: "brightness of the lightbulb",
				},
				native: {
					path: "lightList.[0].dimmer",
				},
			};
			stateObjs["lightbulb.state"] = {
				_id: `${objId}.lightbulb.state`,
				type: "state",
				common: {
					name: "on/off",
					read: true, // TODO: check
					write: true, // TODO: check
					type: "boolean",
					role: "switch",
				},
				native: {
					path: "lightList.[0].onOff",
				},
			};
		}

		const createObjects = Object.keys(stateObjs)
			.map((key) => {
				const stateId = `${objId}.${key}`;
				const obj = stateObjs[key];
				let initialValue = null;
				if (_.isdef(obj.native.path)) {
					// Object could have a default value, find it
					initialValue = readPropertyValue(accessory, obj.native.path);
					if (obj.common.type === "boolean") {
						// fix bool values
						initialValue = initialValue === 1 || initialValue === "true" || initialValue === "on";
					}
				}
				// create object and return the promise, so we can wait
				return adapter.$createOwnStateEx(stateId, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}

// ==================================
// Custom subscriptions
// Object.assign(customSubscriptions, {
// 	counter: 0,
// 	subscriptions: {
// 		// "<id>" : {pattern, callback}
// 	},
// });

/**
 * Ensures the subscription pattern is valid
 */
function checkPattern(pattern: string | RegExp): RegExp {
	try {
		if (typeof pattern === "string") {
			return str2regex(pattern);
		} else if (pattern instanceof RegExp) {
			return pattern;
		} else {
			// NOPE
			throw new Error("must be regex or string");
		}
	} catch (e) {
		_.log("cannot subscribe with this pattern. reason: " + e);
		return null;
	}
}

/**
 * Subscribe to some ioBroker states
 * @param pattern
 * @param callback
 * @returns a subscription ID
 */
function subscribeStates(pattern: string | RegExp, callback: (id: string, state: ioBroker.State) => void): string {

	pattern = checkPattern(pattern);
	if (!pattern) return;

	const newCounter = (++customStateSubscriptions.counter);
	const id = "" + newCounter;

	customStateSubscriptions.subscriptions[id] = { pattern, callback };

	// _.log(`added subscription for pattern ${pattern}. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);

	return id;
}

/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id: string) {
	// _.log(`unsubscribing subscription #${id}...`);
	if (customStateSubscriptions.subscriptions[id]) {
		// const pattern = customSubscriptions.subscriptions[id].pattern;
		delete customStateSubscriptions.subscriptions[id];
		// _.log(`unsubscribe ${pattern}: success. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
	} else {
		// _.log(`unsubscribe: subscription not found`);
	}
}

/**
 * Subscribe to some ioBroker objects
 * @param pattern
 * @param callback
 * @returns a subscription ID
 */
function subscribeObjects(pattern: string | RegExp, callback: (id: string, object: ioBroker.Object) => void): string {

	pattern = checkPattern(pattern);
	if (!pattern) return;

	const newCounter = (++customObjectSubscriptions.counter);
	const id = "" + newCounter;

	customObjectSubscriptions.subscriptions[id] = { pattern, callback };

	// _.log(`added subscription for pattern ${pattern}. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);

	return id;
}

/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id: string) {
	// _.log(`unsubscribing subscription #${id}...`);
	if (customObjectSubscriptions.subscriptions[id]) {
		// const pattern = customSubscriptions.subscriptions[id].pattern;
		delete customObjectSubscriptions.subscriptions[id];
		// _.log(`unsubscribe ${pattern}: success. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
	} else {
		// _.log(`unsubscribe: subscription not found`);
	}
}

function parsePayload(response) {
	switch (response.format) {
		case 0: // text/plain
			return response.payload.toString("utf-8");
		case 50: // application/json
			const json = response.payload.toString("utf-8");
			return JSON.parse(json);
		default: // dunno how to parse this
			return response.payload;
	}
}

// Unbehandelte Fehler tracen
process.on("unhandledRejection", r => {
	adapter.log.error("unhandled promise rejection: " + r);
});
process.on("uncaughtException", err => {
	adapter.log.error("unhandled exception:" + err.message);
	adapter.log.error("> stack: " + err.stack);
	process.exit(1);
});
