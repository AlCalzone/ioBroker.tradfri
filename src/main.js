"use strict";
// Babel polyfill
import "babel-polyfill";

// Eigene Module laden
import _ from "./lib/global";
//import { promisify, waterfall } from "./lib/promises";
import { str2regex } from "./lib/str2regex";
import { entries, values, filter, dig, /*bury, extend*/ } from "./lib/object-polyfill";
import { /*intersect,*/ except } from "./lib/array-extensions";
// import { getEnumValueAsName } from "./lib/enums";
import Coap from "./lib/coapClient";
import coapEndpoints from "./ipso/endpoints";

// Datentypen laden
import Accessory from "./ipso/accessory";
import accessoryTypes from "./ipso/accessoryTypes";

// Adapter-Utils laden
import utils from "./lib/utils";

// Konvertierungsfunktionen
import conversions from "./lib/conversions";

const customSubscriptions = {}; // wird unten intialisiert
// dictionary of COAP observers
const observers = {};
// dictionary of known devices
const devices = {};
// dictionary of ioBroker objects
const objects = {};

// Adapter-Objekt erstellen
const adapter = utils.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: function () {
		// Adapter-Instanz global machen
		_.adapter = adapter;

		// Eigene Objekte/States beobachten
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

		// Custom subscriptions erlauben 
		_.subscribe = subscribe;
		_.unsubscribe = unsubscribe;

		// TODO: load known devices from ioBroker into <devices> & <objects>
		observeDevices();

	},

	message: (obj) => {
		// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
		if (typeof obj == 'object' && obj.message) {
			if (obj.command == 'send') {
				// e.g. send email or pushover or whatever
				//console.log('send command');

				// Send response in callback if required
				if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
			}
		}
	},

	objectChange: (id, obj) => {
		_.log(`{{blue}} object with id ${id} updated`);
		if (id.startsWith(adapter.namespace)) {
			// this is our own object, remember it!
			objects[id] = obj;
		}
	},

	stateChange: (id, state) => {
		_.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`);
		if (!state.ack && id.startsWith(adapter.namespace)) {
			// our own state was changed from within ioBroker, react to it

			const stateObj = objects[id];
			if (!(stateObj && stateObj.native && stateObj.native.path)) return;

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
				if (_.isdef(stateObj.common.min))
					val = Math.max(stateObj.common.min, val);
				if (_.isdef(stateObj.common.max))
					val = Math.min(stateObj.common.max, val);

				// TODO: find a way to construct these from existing accessory objects
				let payload = null;
				if (id.endsWith(".lightbulb.state")) {
					payload = { "3311": [{ "5850": (val ? 1 : 0)}] };
				} else if (id.endsWith(".lightbulb.brightness")) {
					payload = { "3311": [{ "5851": val, "5712": 5  }] };
				} else if (id.endsWith(".lightbulb.color")) {
					const colorX = conversions.color("out", state.val);
					payload = { "3311": [{ "5709": colorX, "5710": 27000, "5712": 5 }] };
				} //else if (id.endsWith(".lightbulb.colorX")) {
				//	const colorY = accessory.lightList[0].colorY;
				//	payload = { "3311": [{ "5709": val, "5710": colorY, "5712": 5 }] };
				//} else if (id.endsWith(".lightbulb.colorY")) {
				//	const colorX = accessory.lightList[0].colorX;
				//	payload = { "3311": [{ "5709": colorX, "5710": val, "5712": 5 }] };
				//}

				_.log("sending payload: " + JSON.stringify(payload));

				const send = new Coap(
					`${coapEndpoints.devices}/${dev.native.instanceId}`
				);
				send.request("put", payload);

			}
		}


		// Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
		try {
			for (let sub of values(customSubscriptions.subscriptions)) {
				if (sub && sub.pattern && sub.callback) {
					// Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
					if (sub.pattern.test(id))
						sub.callback(id, state);
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
			for (let obs of values(observers)) {
				obs.stop();
			}
			callback();
		} catch (e) {
			callback();
		}
	},
});

// ==================================
// manage devices

function observeDevices() {
	observers.allDevices = new Coap(coapEndpoints.devices, coapCb_getAllDevices);
	observers.allDevices.observe();
}

// gets called whenever "get /15001" updates
function coapCb_getAllDevices(newDevices, _dummy, info) {

	_.log(`got all devices (${JSON.stringify(info)}): ${JSON.stringify(newDevices)}`);

	// get old keys as int array
	const oldKeys = Object.keys(devices).map(k => +k).sort();
	// get new keys as int array
	const newKeys = newDevices.sort();
	// translate that into added and removed devices
	const addedKeys = except(newKeys, oldKeys);
	_.log(`adding devices with keys ${JSON.stringify(addedKeys)}`);
	addedKeys.forEach(id => {
		const observerKey = `devices/${id}`;
		if (_.isdef(observers[observerKey])) return;

		// make a dummy object, we'll be filling that one later
		devices[id] = {};
		// add observer
		const obs = new Coap(
			`${coapEndpoints.devices}/${id}`,
			coap_getDevice_cb,
			id
		);
		obs.observe(); // internal mutex will take care of sequencing
		observers[observerKey] = obs;
	});


	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing devices with keys ${JSON.stringify(removedKeys)}`);
	removedKeys.forEach(id => {
		const observerKey = `devices/${id}`;
		if (!_.isdef(observers[observerKey])) return;
		// remove device from dictionary
		delete devices[id];
		// remove observers
		observers[observerKey].stop();
		delete observers[observerKey];

		// TODO: delete ioBroker device
	});

	_.log(`active observers: ${Object.keys(observers).map(k => k + ": " + observers[k].endpoint)}`);
}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(result, instanceId, _info) {
	_.log(`got device details ${instanceId} (${JSON.stringify(_info)}): ${JSON.stringify(result)}`);
	// parse device info
	const accessory = new Accessory(result);
	// remember the device object, so we can later use it as a reference for updates
	devices[instanceId] = accessory;
	//_.log(`got device details for ${instanceId}:`);
	//_.log(JSON.stringify(accessory));
	// create ioBroker device
	extendDevice(accessory);
}

function getAccessoryId(stateId) {
	const match = /^tradfri\.\d+\.[\w\-\d]+/.exec(stateId);
	if (match) return match[0];
}

function calcObjId(accessory) {
	let prefix = (() => {
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
			let value = dig(accessory, path);
			// and convert it
			return conversions[fnName]("in", value);
		}
		catch (e) {
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
			name: accessory.name
		};
		if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
			devObj.common = newCommon;
			changed = true;
		}
		const newNative = {
			instanceId: accessory.instanceId,
			manufacturer: accessory.deviceInfo.manufacturer,
			firmwareVersion: accessory.deviceInfo.firmwareVersion
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
			obj => obj._id.startsWith(objId) && obj.native && obj.native.path
		);
		// for each property try to update the value
		for (let [id, obj] of entries(stateObjs)) {
			try {
				// Object could have a default value, find it
				let newValue = readPropertyValue(accessory, obj.native.path);
				if (obj.common.type === "boolean") {
					// fix bool values
					newValue = newValue === 1 || newValue === "true" || newValue === "on";
				}
				adapter.setState(id, newValue, true);
			} catch (e) {/* skip this value */}
		}

	} else {
		// create new object
		const devObj = {
			_id: objId,
			type: "device",
			common: {
				name: accessory.name
			},
			native: {
				instanceId: accessory.instanceId,
				manufacturer: accessory.deviceInfo.manufacturer,
				firmwareVersion: accessory.deviceInfo.firmwareVersion
			}
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
					desc: "indicates if the device is currently alive and connected to the gateway"
				},
				native: {
					path: "alive"
				}
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
					desc: "indicates when the device has last been seen by the gateway"
				},
				native: {
					path: "lastSeen"
				}
			}
		};
		
		if (accessory.type === accessoryTypes.lightbulb) {
			//stateObjs["lightbulb.color"] = {
			//	_id: `${objId}.lightbulb.color`,
			//	type: "state",
			//	common: {
			//		name: "RGB color",
			//		read: true, // TODO: check
			//		write: false, // TODO: check
			//		type: "string",
			//		role: "level.color.rgb",
			//		desc: "hex representation of the lightbulb color"
			//	},
			//	native: {
			//		path: "lightList.[0].color"
			//	}
			//};
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
					desc: "range: 0% = cold, 100% = warm"
				},
				native: {
					path: "__convert:color,lightList.[0].colorX"
				}
			};
			//stateObjs["lightbulb.colorX"] = {
			//	_id: `${objId}.lightbulb.colorX`,
			//	type: "state",
			//	common: {
			//		name: "CIE 1931 x coordinate",
			//		read: true, // TODO: check
			//		write: true, // TODO: check
			//		min: 24930,
			//		max: 33135,
			//		type: "number",
			//		role: "level.color.temperature",
			//		desc: "x coordinate of the color temperature in the CIE 1931 color space"
			//	},
			//	native: {
			//		path: "lightList.[0].colorX"
			//	}
			//};
			//stateObjs["lightbulb.colorY"] = {
			//	_id: `${objId}.lightbulb.colorY`,
			//	type: "state",
			//	common: {
			//		name: "CIE 1931 y coordinate",
			//		read: true, // TODO: check
			//		write: true, // TODO: check
			//		min: 24694,
			//		max: 27211,
			//		type: "number",
			//		role: "level.color.temperature",
			//		desc: "y coordinate of the color temperature in the CIE 1931 color space"
			//	},
			//	native: {
			//		path: "lightList.[0].colorY"
			//	}
			//};
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
					desc: "brightness of the lightbulb"
				},
				native: {
					path: "lightList.[0].dimmer"
				}
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
					path: "lightList.[0].onOff"
				}
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
Object.assign(customSubscriptions, {
	counter: 0,
	subscriptions: {
		// "<id>" : {pattern, callback}
	},
});
function subscribe(pattern, callback) {

	try {
		if (typeof pattern === "string") {
			pattern = str2regex(pattern);
		} else if (pattern instanceof RegExp) {
			// so sollte es sein
		} else {
			// NOPE
			throw "must be regex or string";
		}
	} catch (e) {
		_.log("cannot subscribe with this pattern. reason: " + e);
	}

	const newCounter = (++customSubscriptions.counter);
	const id = "" + newCounter;

	customSubscriptions.subscriptions[id] = { pattern, callback };

	//_.log(`added subscription for pattern ${pattern}. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);

	return id;
}
function unsubscribe(id) {
	//_.log(`unsubscribing subscription #${id}...`);
	if (customSubscriptions.subscriptions[id]) {
		//const pattern = customSubscriptions.subscriptions[id].pattern;
		delete customSubscriptions.subscriptions[id];
		//_.log(`unsubscribe ${pattern}: success. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
	} else {
		//_.log(`unsubscribe: subscription not found`);
	}
}

// Unbehandelte Fehler tracen
process.on('unhandledRejection', r => {
	adapter.log.error("unhandled promise rejection: " + r);
});
