// tslint:disable:object-literal-key-quotes

// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

// Eigene Module laden
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import coapEndpoints from "./ipso/endpoints";
import { except } from "./lib/array-extensions";
import { ExtendedAdapter, Global as _ } from "./lib/global";
import { composeObject, DictionaryLike, dig, entries, filter, values } from "./lib/object-polyfill";
import { str2regex } from "./lib/str2regex";

// Datentypen laden
import { Accessory, AccessoryTypes } from "./ipso/accessory";
import { Group } from "./ipso/group";
import { IPSOObject } from "./ipso/ipsoObject";
import { Light } from "./ipso/light";
import { Scene } from "./ipso/scene";

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
const observers: string[] = [];
// dictionary of known devices
const devices: DictionaryLike<Accessory> = {};
// dictionary of known groups
interface GroupInfo {
	group: Group;
	scenes: DictionaryLike<Scene>;
}
const groups: DictionaryLike<GroupInfo> = {};
// dictionary of ioBroker objects
const objects: DictionaryLike<ioBroker.Object> = {};

// the base of all requests
let requestBase: string;

// Adapter-Objekt erstellen
let adapter: ExtendedAdapter = utils.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: async () => {

		// Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
		if (adapter.config
			&& adapter.config.host != null && adapter.config.host !== ""
			&& adapter.config.securityCode != null && adapter.config.securityCode !== ""
		) {
			// alles gut
		} else {
			adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
			return;
		}

		// Adapter-Instanz global machen
		adapter = _.extend(adapter);
		_.adapter = adapter;

		// Bei Debug-Loglevel die Debugausgaben der Module umleiten
		if (adapter.log.level === "debug") {
			_.log("== debug mode active ==");
			process.env.DEBUG = "*";
			const debugPackage = require("debug");
			debugPackage.log = adapter.log.debug.bind(adapter);
		}
		_.log(`startfile = ${process.argv[1]}`);

		// Eigene Objekte/States beobachten
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

		// Custom subscriptions erlauben
		_.subscribeStates = subscribeStates;
		_.unsubscribeStates = unsubscribeStates;
		_.subscribeObjects = subscribeObjects;
		_.unsubscribeObjects = unsubscribeObjects;

		// initialize CoAP client
		const hostname = (adapter.config.host as string).toLowerCase();
		coap.setSecurityParams(hostname, {
			psk: { "Client_identity": adapter.config.securityCode },
		});
		requestBase = `coaps://${hostname}:5684/`;

		// TODO: load known devices from ioBroker into <devices> & <objects>
		// TODO: we might need the send-queue branch of node-coap-client at some point
		await observeDevices();
		await observeGroups();

	},

	message: async (obj) => {
		// responds to the adapter that sent the original message
		function respond(response) {
			if (obj.callback) adapter.sendTo(obj.from, obj.command, response, obj.callback);
		}
		// some predefined responses so we only have to define them once
		const predefinedResponses = {
			ACK: { error: null },
			OK: { error: null, result: "ok" },
			ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
			MISSING_PARAMETER: (paramName) => {
				return { error: 'missing parameter "' + paramName + '"!' };
			},
			COMMAND_RUNNING: { error: "command running" },
		};
		// make required parameters easier
		function requireParams(...params: string[]) {
			if (!(params && params.length)) return true;
			for (const param of params) {
				if (!(obj.message && obj.message.hasOwnProperty(param))) {
					respond(predefinedResponses.MISSING_PARAMETER(param));
					return false;
				}
			}
			return true;
		}

		// handle the message
		if (obj) {
			switch (obj.command) {
				case "request":
					// require the path to be given
					if (!requireParams("path")) return;

					// check the given params
					const params = obj.message as any;
					params.method = params.method || "get";
					if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
						respond({ error: `unsupported request method "${params.method}"` });
						return;
					}

					_.log(`custom coap request: ${params.method.toUpperCase()} "${requestBase}${params.path}"`, { level: _.loglevels.on });

					// create payload
					let payload: string | Buffer;
					if (params.payload) {
						payload = JSON.stringify(params.payload);
						_.log("sending custom payload: " + payload, { level: _.loglevels.on });
						payload = Buffer.from(payload);
					}

					// wait for the CoAP response and respond to the message
					const resp = await coap.request(`${requestBase}${params.path}`, params.method, payload as Buffer);
					respond({
						error: null, result: {
							code: resp.code.toString(),
							payload: parsePayload(resp),
						},
					});
					return;
				default:
					respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
					return;
			}
		}
	},

	objectChange: (id, obj) => {
		_.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, { level: _.loglevels.ridiculous });
		if (id.startsWith(adapter.namespace)) {
			// this is our own object.

			if (obj) {
				// first check if we have to modify a device/group/whatever
				const instanceId = getInstanceId(id);
				if (obj.type === "device" && instanceId in devices && devices[instanceId] != null) {
					// if this device is in the device list, check for changed properties
					const acc = devices[instanceId];
					if (obj.common && obj.common.name !== acc.name) {
						// the name has changed, notify the gateway
						_.log(`the device ${id} was renamed to "${obj.common.name}"`);
						renameDevice(acc, obj.common.name);
					}
				} else if (obj.type === "channel" && instanceId in groups && groups[instanceId] != null) {
					// if this group is in the groups list, check for changed properties
					const grp = groups[instanceId].group;
					if (obj.common && obj.common.name !== grp.name) {
						// the name has changed, notify the gateway
						_.log(`the group ${id} was renamed to "${obj.common.name}"`);
						renameGroup(grp, obj.common.name);
					}
				}
				// remember the object
				objects[id] = obj;
			} else {
				// object deleted, forget it
				if (id in objects) delete objects[id];
			}

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

	stateChange: async (id, state) => {
		if (state) {
			_.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`, { level: _.loglevels.ridiculous });
		} else {
			_.log(`{{blue}} state with id ${id} deleted`, { level: _.loglevels.ridiculous });
		}

		if (state && !state.ack && id.startsWith(adapter.namespace)) {
			// our own state was changed from within ioBroker, react to it

			const stateObj = objects[id];
			if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path)) return;

			// get "official" value for the parent object
			const rootId = getRootId(id);
			if (rootId) {
				// get the ioBroker object
				const rootObj = objects[rootId];

				// for now: handle changes on a case by case basis
				// everything else is too complicated for now
				let val = state.val;
				// make sure we have whole numbers
				if (stateObj.common.type === "number") {
					val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
					if (_.isdef(stateObj.common.min)) val = Math.max(stateObj.common.min, val);
					if (_.isdef(stateObj.common.max)) val = Math.min(stateObj.common.max, val);
				}

				// this will contain the serialized payload
				let serializedObj: DictionaryLike<any>;
				// this will contain the url to be requested
				let url: string;

				switch (rootObj.native.type) {
					case "group":
						// read the instanceId and get a reference value
						const group = groups[rootObj.native.instanceId].group;
						// create a copy to modify
						const newGroup = group.clone();

						if (id.endsWith("state")) {
							// just turn on or off
							newGroup.onOff = val;
						} else if (id.endsWith("activeScene")) {
							// turn on and activate a scene
							newGroup.merge({
								onOff: true,
								sceneId: val,
							});
						}

						serializedObj = newGroup.serialize(group); // serialize with the old object as a reference
						url = `${requestBase}${coapEndpoints.groups}/${rootObj.native.instanceId}`;
						break;

					default: // accessory
						// read the instanceId and get a reference value
						const accessory = devices[rootObj.native.instanceId];
						// create a copy to modify
						const newAccessory = accessory.clone();
						if (id.indexOf(".lightbulb.") > -1) {
							// get the Light instance to modify
							const light = newAccessory.lightList[0];

							if (id.endsWith(".state")) {
								light.merge({ onOff: val });
							} else if (id.endsWith(".brightness")) {
								light.merge({
									dimmer: val,
									transitionTime: 5, // TODO: <- make this configurable
								});
							} else if (id.endsWith(".color")) {
								const colorX = conversions.color("out", state.val);
								light.merge({
									colorX: colorX,
									colorY: 27000,
									transitionTime: 5, // TODO: <- make this configurable
								});
							}
						}

						serializedObj = newAccessory.serialize(accessory); // serialize with the old object as a reference
						url = `${requestBase}${coapEndpoints.devices}/${rootObj.native.instanceId}`;
						break;
				}

				// If the serialized object contains no properties, we don't need to send anything
				if (!serializedObj || Object.keys(serializedObj).length === 0) {
					_.log("stateChange > empty object, not sending any payload", { level: _.loglevels.ridiculous });
					await adapter.$setState(id, state.val, true);
					return;
				}

				let payload: string | Buffer = JSON.stringify(serializedObj);
				_.log("stateChange > sending payload: " + payload, { level: _.loglevels.ridiculous });

				payload = Buffer.from(payload);
				coap.request(url, "put", payload);

			}
		} else if (!state) {
			// TODO: find out what to do when states are deleted
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

/** Normalizes the path to a resource, so it can be used for storing the observer */
function normalizeResourcePath(path: string): string {
	path = path || "";
	while (path.startsWith("/")) path = path.substring(1);
	while (path.endsWith("/")) path = path.substring(0, -1);
	return path;
}

/**
 * Observes a resource at the given url and calls the callback when the information is updated
 * @param path The path of the resource (without requestBase)
 * @param callback The callback to be invoked when the resource updates
 */
async function observeResource(path: string, callback: (resp: CoapResponse) => void): Promise<void> {

	path = normalizeResourcePath(path);

	// check if we are already observing this resource
	const observerUrl = `${requestBase}${path}`;
	if (observers.indexOf(observerUrl) > -1) return;

	// start observing
	observers.push(observerUrl);
	return coap.observe(observerUrl, "get", callback);
}

/**
 * Stops observing a resource
 * @param path The path of the resource (without requestBase)
 */
function stopObservingResource(path: string): void {

	path = normalizeResourcePath(path);

	// remove observer
	const observerUrl = `${requestBase}${path}`;
	const index = observers.indexOf(observerUrl);
	if (index === -1) return;

	coap.stopObserving(observerUrl);
	observers.splice(index, 1);
}

/** Sets up an observer for all devices */
async function observeDevices() {
	await observeResource(
		coapEndpoints.devices,
		coapCb_getAllDevices,
	);
}
// gets called whenever "get /15001" updates
async function coapCb_getAllDevices(response: CoapResponse) {

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

	const addDevices = addedKeys.map(id => {
		return observeResource(
			`${coapEndpoints.devices}/${id}`,
			(resp) => coap_getDevice_cb(id, resp),
		);
	});
	await Promise.all(addDevices);

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing devices with keys ${JSON.stringify(removedKeys)}`, { level: _.loglevels.ridiculous });
	removedKeys.forEach(id => {
		// remove device from dictionary
		if (devices.hasOwnProperty(id)) delete devices[id];

		// remove observer
		stopObservingResource(`${coapEndpoints.devices}/${id}`);

		// TODO: delete ioBroker device
	});

}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(instanceId: number, response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getDevice(${instanceId}).`, { severity: _.severity.error });
		return;
	}
	const result = parsePayload(response);
	// parse device info
	const accessory = new Accessory();
	accessory.parse(result);
	// remember the device object, so we can later use it as a reference for updates
	devices[instanceId] = accessory;
	// create ioBroker device
	extendDevice(accessory);
}

/** Sets up an observer for all groups */
async function observeGroups() {
	await observeResource(
		coapEndpoints.groups,
		coapCb_getAllGroups,
	);
}
// gets called whenever "get /15004" updates
async function coapCb_getAllGroups(response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getAllGroups.`, { severity: _.severity.error });
		return;
	}
	const newGroups = parsePayload(response);

	_.log(`got all groups: ${JSON.stringify(newGroups)}`);

	// get old keys as int array
	const oldKeys = Object.keys(devices).map(k => +k).sort();
	// get new keys as int array
	const newKeys = newGroups.sort();
	// translate that into added and removed devices
	const addedKeys = except(newKeys, oldKeys);
	_.log(`adding groups with keys ${JSON.stringify(addedKeys)}`, { level: _.loglevels.ridiculous });

	const addGroups = addedKeys.map(id => {
		return observeResource(
			`${coapEndpoints.groups}/${id}`,
			(resp) => coap_getGroup_cb(id, resp),
		);
	});
	await Promise.all(addGroups);

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing groups with keys ${JSON.stringify(removedKeys)}`, { level: _.loglevels.ridiculous });
	removedKeys.forEach(id => {
		// remove device from dictionary
		if (devices.hasOwnProperty(id)) delete devices[id];

		// remove observer
		stopObservingResource(`${coapEndpoints.groups}/${id}`);

		// TODO: delete ioBroker device
	});

}
// gets called whenever "get /15004/<instanceId>" updates
function coap_getGroup_cb(instanceId: number, response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getGroup(${instanceId}).`, { severity: _.severity.error });
		return;
	}
	const result = parsePayload(response);
	// parse group info
	const group = (new Group()).parse(result);
	// remember the group object, so we can later use it as a reference for updates
	groups[instanceId] = {
		group,
		scenes: {},
	};
	// create ioBroker states
	extendGroup(group);
	// and load scene information
	observeResource(
		`${coapEndpoints.scenes}/${instanceId}`,
		(resp) => coap_getAllScenes_cb(instanceId, resp),
	);
}

// gets called whenever "get /15005/<groupId>" updates
async function coap_getAllScenes_cb(groupId: number, response: CoapResponse) {
	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getAllScenes(${groupId}).`, { severity: _.severity.error });
		return;
	}

	const groupInfo = groups[groupId];
	const newScenes = parsePayload(response);

	_.log(`got all scenes in group ${groupId}: ${JSON.stringify(newScenes)}`);

	// get old keys as int array
	const oldKeys = Object.keys(groupInfo.scenes).map(k => +k).sort();
	// get new keys as int array
	const newKeys = newScenes.sort();
	// translate that into added and removed devices
	const addedKeys = except(newKeys, oldKeys);
	_.log(`adding scenes with keys ${JSON.stringify(addedKeys)} to group ${groupId}`, { level: _.loglevels.ridiculous });

	const addScenes = addedKeys.map(id => {
		return observeResource(
			`${coapEndpoints.scenes}/${groupId}/${id}`,
			(resp) => coap_getScene_cb(groupId, id, resp),
		);
	});
	await Promise.all(addScenes);

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing scenes with keys ${JSON.stringify(removedKeys)} from group ${groupId}`, { level: _.loglevels.ridiculous });
	removedKeys.forEach(id => {
		// remove device from dictionary
		if (groupInfo.scenes.hasOwnProperty(id)) delete groupInfo.scenes[id];

		// remove observer
		stopObservingResource(`${coapEndpoints.scenes}/${groupId}/${id}`);

		// TODO: delete ioBroker device
	});
}

// gets called whenever "get /15005/<groupId>/<instanceId>" updates
function coap_getScene_cb(groupId: number, instanceId: number, response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getScene(${groupId}, ${instanceId}).`, { severity: _.severity.error });
		return;
	}
	const result = parsePayload(response);
	// parse scene info
	const scene = (new Scene()).parse(result);
	// remember the scene object, so we can later use it as a reference for updates
	groups[groupId].scenes[instanceId] = scene;
	// Update the scene dropdown for the group
	updatePossibleScenes(groups[groupId].group);
}

/**
 * Returns the ioBroker id of the root object for the given state
 */
function getRootId(stateId: string) {
	const match = /^tradfri\.\d+\.\w+\-\d+/.exec(stateId);
	if (match) return match[0];
}
/**
 * Extracts the instance id from a given state or object id
 * @param id State or object id whose instance id should be extracted
 */
function getInstanceId(id: string): number {
	const match = /^tradfri\.\d+\.\w+\-(\d+)/.exec(id);
	if (match) return +match[1];
}

/**
 * Determines the object ID under which the given accessory should be stored
 */
function calcObjId(accessory: Accessory) {
	const prefix = (() => {
		switch (accessory.type) {
			case AccessoryTypes.remote:
				return "RC";
			case AccessoryTypes.lightbulb:
				return "L";
			default:
				_.log("unknown accessory type " + accessory.type);
				return "XYZ";
		}
	})();
	return `${adapter.namespace}.${prefix}-${accessory.instanceId}`;
}

/**
 * Determines the object ID under which the given group should be stored
 */
function calcGroupId(group: Group) {
	return `${adapter.namespace}.G-${group.instanceId}`;
}

/**
 * Determines the object ID under which the given scene should be stored
 */
function calcSceneId(scene: Scene) {
	return `${adapter.namespace}.S-${scene.instanceId}`;
}

/**
 * finds the property value for @link{accessory} as defined in @link{propPath}
 * @param The accessory to be searched for the property
 * @param The property path under which the property is accessible
 */
function readPropertyValue(source: DictionaryLike<any>, propPath: string) {
	// if path starts with "__convert:", use a custom conversion function
	if (propPath.startsWith("__convert:")) {
		const pathParts = propPath.substr("__convert:".length).split(",");
		try {
			const fnName = pathParts[0];
			const path = pathParts[1];
			// find initial value on the object
			const value = dig(source, path);
			// and convert it
			return conversions[fnName]("in", value);
		} catch (e) {
			_.log(`invalid path definition ${propPath}`);
		}
	} else {
		return dig(source, propPath);
	}
}

/**
 * Returns the common part of the ioBroker object representing the given accessory
 */
function accessoryToCommon(accessory: Accessory): ioBroker.ObjectCommon {
	return {
		name: accessory.name,
	};
}

/**
 * Returns the native part of the ioBroker object representing the given accessory
 */
function accessoryToNative(accessory: Accessory): DictionaryLike<any> {
	return {
		instanceId: accessory.instanceId,
		manufacturer: accessory.deviceInfo.manufacturer,
		firmwareVersion: accessory.deviceInfo.firmwareVersion,
		modelNumber: accessory.deviceInfo.modelNumber,
		type: AccessoryTypes[accessory.type],
		serialNumber: accessory.deviceInfo.serialNumber,
	};
}

/* creates or edits an existing <device>-object for an accessory */
function extendDevice(accessory: Accessory) {
	const objId = calcObjId(accessory);

	if (_.isdef(objects[objId])) {
		// check if we need to edit the existing object
		const devObj = objects[objId];
		let changed = false;
		// update common part if neccessary
		const newCommon = accessoryToCommon(accessory);
		if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
			// merge the common objects
			Object.assign(devObj.common, newCommon);
			changed = true;
		}
		const newNative = accessoryToNative(accessory);
		// update native part if neccessary
		if (JSON.stringify(devObj.native) !== JSON.stringify(newNative)) {
			// merge the native objects
			Object.assign(devObj.native, newNative);
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
				const newValue = readPropertyValue(accessory, obj.native.path);
				adapter.setState(id, newValue, true);
			} catch (e) {/* skip this value */}
		}

	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "device",
			common: accessoryToCommon(accessory),
			native: accessoryToNative(accessory),
		};
		adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		const stateObjs: DictionaryLike<ioBroker.Object> = {
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

		if (accessory.type === AccessoryTypes.lightbulb) {
			// obj.lightbulb should be a channel
			stateObjs.lightbulb = {
				_id: `${objId}.lightbulb`,
				type: "channel",
				common: {
					name: "Lightbulb",
					role: "light",
				},
				native: {
					/* Nothing here */
				},
			};
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
					role: "light.dimmer",
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
				}
				// create object and return the promise, so we can wait
				return adapter.$createOwnStateEx(stateId, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}

/**
 * Returns the common part of the ioBroker object representing the given group
 */
function groupToCommon(group: Group): ioBroker.ObjectCommon {
	return {
		name: group.name,
	};
}

/**
 * Returns the native part of the ioBroker object representing the given group
 */
function groupToNative(group: Group): DictionaryLike<any> {
	return {
		instanceId: group.instanceId,
		deviceIDs: group.deviceIDs,
		type: "group",
	};
}

/* creates or edits an existing <group>-object for a group */
function extendGroup(group: Group) {
	const objId = calcGroupId(group);

	if (_.isdef(objects[objId])) {
		// check if we need to edit the existing object
		const grpObj = objects[objId];
		let changed = false;
		// update common part if neccessary
		const newCommon = groupToCommon(group);
		if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
			// merge the common objects
			Object.assign(grpObj.common, newCommon);
			changed = true;
		}
		const newNative = groupToNative(group);
		// update native part if neccessary
		if (JSON.stringify(grpObj.native) !== JSON.stringify(newNative)) {
			// merge the native objects
			Object.assign(grpObj.native, newNative);
			changed = true;
		}
		if (changed) adapter.extendObject(objId, grpObj);

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
				const newValue = readPropertyValue(group, obj.native.path);
				adapter.setState(id, newValue, true);
			} catch (e) {/* skip this value */ }
		}

	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "channel",
			common: groupToCommon(group),
			native: groupToNative(group),
		};
		adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		const stateObjs: DictionaryLike<ioBroker.Object> = {
			activeScene: { // currently active scene
				_id: `${objId}.activeScene`,
				type: "state",
				common: {
					name: "active scene",
					read: true,
					write: true,
					type: "number",
					role: "value.id",
					desc: "the instance id of the currently active scene",
				},
				native: {
					path: "sceneId",
				},
			},
			state: {
				_id: `${objId}.state`,
				type: "state",
				common: {
					name: "on/off",
					read: true, // TODO: check
					write: true, // TODO: check
					type: "boolean",
					role: "switch",
				},
				native: {
					path: "onOff",
				},
			},
		};

		const createObjects = Object.keys(stateObjs)
			.map((key) => {
				const stateId = `${objId}.${key}`;
				const obj = stateObjs[key];
				let initialValue = null;
				if (_.isdef(obj.native.path)) {
					// Object could have a default value, find it
					initialValue = readPropertyValue(group, obj.native.path);
				}
				// create object and return the promise, so we can wait
				return adapter.$createOwnStateEx(stateId, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}

async function updatePossibleScenes(group: Group): Promise<void> {
	// if this group is not in the dictionary, don't do anything
	if (!(group.instanceId in groups)) return;
	// find out which is the root object id
	const objId = calcGroupId(group);
	// scenes are stored under <objId>.activeScene
	const scenesId = `${objId}.activeScene`;

	// only extend that object if it exists already
	if (_.isdef(objects[scenesId])) {
		const activeSceneObj = objects[scenesId];
		const scenes = groups[group.instanceId].scenes;
		// map scene ids and names to the dropdown
		const states = composeObject(
			Object.keys(scenes).map(id => [id, scenes[id].name] as [string, string]),
		);
		await adapter.extendObject(scenesId, { common: { states } } as any /* This is a partial of a partial, not correctly defined in ioBroker.d.ts */);
	}
}

/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 */
function renameDevice(accessory: Accessory, newName: string): void {
	// create a copy to modify
	const newAccessory = accessory.clone();
	newAccessory.name = newName;

	// serialize with the old object as a reference
	const serializedObj = newAccessory.serialize(accessory);
	// If the serialized object contains no properties, we don't need to send anything
	if (!serializedObj || Object.keys(serializedObj).length === 0) {
		_.log("renameDevice > empty object, not sending any payload", { level: _.loglevels.ridiculous });
		return;
	}

	// get the payload
	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("renameDevice > sending payload: " + payload, { level: _.loglevels.ridiculous });
	payload = Buffer.from(payload);

	coap.request(
		`${requestBase}${coapEndpoints.devices}/${accessory.instanceId}`, "put", payload,
	);

}

/**
 * Renames a group
 * @param group The group to be renamed
 * @param newName The new name to be given to the group
 */
function renameGroup(group: Group, newName: string): void {
	// create a copy to modify
	const newGroup = group.clone();
	newGroup.name = newName;

	// serialize with the old object as a reference
	const serializedObj = newGroup.serialize(group);
	// If the serialized object contains no properties, we don't need to send anything
	if (!serializedObj || Object.keys(serializedObj).length === 0) {
		_.log("renameGroup > empty object, not sending any payload", { level: _.loglevels.ridiculous });
		return;
	}

	// get the payload
	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("renameDevice > sending payload: " + payload, { level: _.loglevels.ridiculous });
	payload = Buffer.from(payload);

	coap.request(
		`${requestBase}${coapEndpoints.groups}/${group.instanceId}`, "put", payload,
	);

}

// ==================================
// Custom subscriptions

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

	return id;
}

/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id: string) {
	if (customStateSubscriptions.subscriptions[id]) {
		delete customStateSubscriptions.subscriptions[id];
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

	return id;
}

/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id: string) {
	if (customObjectSubscriptions.subscriptions[id]) {
		delete customObjectSubscriptions.subscriptions[id];
	}
}

function parsePayload(response: CoapResponse): any {
	switch (response.format) {
		case 0: // text/plain
		case null: // assume text/plain
			return response.payload.toString("utf-8");
		case 50: // application/json
			const json = response.payload.toString("utf-8");
			return JSON.parse(json);
		default:
			// dunno how to parse this
			_.log(`unknown CoAP response format ${response.format}`, { severity: _.severity.warn });
			return response.payload;
	}
}

// Unbehandelte Fehler tracen
process.on("unhandledRejection", (r: Error) => {
	adapter.log.error("unhandled promise rejection: " + r);
});
process.on("uncaughtException", (err: Error) => {
	adapter.log.error("unhandled exception:" + err.message);
	adapter.log.error("> stack: " + err.stack);
	process.exit(1);
});
