// tslint:disable:object-literal-key-quotes

// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

// Eigene Module laden
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { endpoints as coapEndpoints} from "./ipso/endpoints";
import { except } from "./lib/array-extensions";
import { ExtendedAdapter, Global as _ } from "./lib/global";
import { composeObject, DictionaryLike, dig, entries, filter, values } from "./lib/object-polyfill";
import { wait } from "./lib/promises";
import { str2regex } from "./lib/str2regex";

// Datentypen laden
import { Accessory, AccessoryTypes } from "./ipso/accessory";
import { Group } from "./ipso/group";
import { IPSOObject } from "./ipso/ipsoObject";
import { Light, Spectrum } from "./ipso/light";
import { Scene } from "./ipso/scene";

// Adapter-Utils laden
import utils from "./lib/utils";

interface CustomStateSubscription {
	pattern: RegExp;
	callback: (id: string, state: ioBroker.State) => void;
}
interface CustomObjectSubscription {
	pattern: RegExp;
	callback: (id: string, obj: ioBroker.Object) => void;
}
const customStateSubscriptions: {
	subscriptions: Map<string, CustomStateSubscription>,
	counter: number,
} = {
		subscriptions: new Map(),
		counter: 0,
	};
const customObjectSubscriptions: {
	subscriptions: Map<string, CustomObjectSubscription>,
	counter: number,
} = {
		subscriptions: new Map(),
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
		// Sicherstellen, dass alle Instance-Objects vorhanden sind
		await _.ensureInstanceObjects();

		// redirect console output
		// console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
		// console.error = (msg) => adapter.log.error("STDERR > " + msg);
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

		// Try a few times to setup a working connection
		const maxTries = 3;
		for (let i = 1; i <= maxTries; i++) {
			if (await coap.tryToConnect(requestBase)) {
				break; // it worked
			} else if (i < maxTries) {
				_.log(`Could not connect to gateway, try #${i}`, "warn");
				await wait(1000);
			} else if (i === maxTries) {
				// no working connection
				_.log(`Could not connect to the gateway ${requestBase} after ${maxTries} tries!`, "error");
				_.log(`Please check your network and adapter settings and restart the adapter!`, "error");
				return;
			}
		}
		await adapter.$setState("info.connection", true, true);
		connectionAlive = true;
		pingTimer = setInterval(pingThread, 10000);

		// TODO: load known devices from ioBroker into <devices> & <objects>
		observeAll();

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

					_.log(`custom coap request: ${params.method.toUpperCase()} "${requestBase}${params.path}"`);

					// create payload
					let payload: string | Buffer;
					if (params.payload) {
						payload = JSON.stringify(params.payload);
						_.log("sending custom payload: " + payload);
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
		_.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, "debug");
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
			for (const sub of customObjectSubscriptions.subscriptions.values()) {
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
			_.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`, "debug");
		} else {
			_.log(`{{blue}} state with id ${id} deleted`, "debug");
		}

		if (dead) {
			_.log("The connection to the gateway is dead.", "error");
			_.log("Cannot send changes.", "error");
			_.log("Please restart the adapter!", "error");
			return;
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

						if (id.endsWith(".state")) {
							newGroup.onOff = val;
						} else if (id.endsWith(".brightness")) {
							newGroup.merge({
								dimmer: val,
								transitionTime: await getTransitionDuration(group),
							});
						} else if (id.endsWith(".activeScene")) {
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
								light.onOff = val;
							} else if (id.endsWith(".brightness")) {
								light.merge({
									dimmer: val,
									transitionTime: await getTransitionDuration(accessory),
								});
							} else if (id.endsWith(".color")) {
								if (light.spectrum === "rgb") {
									light.merge({
										color: val,
										transitionTime: await getTransitionDuration(accessory),
									});
								} else if (light.spectrum === "white") {
									light.merge({
										colorTemperature: val,
										transitionTime: await getTransitionDuration(accessory),
									});
								}
							} else if (id.endsWith(".colorTemperature")) {
								light.merge({
									colorTemperature: val,
									transitionTime: await getTransitionDuration(accessory),
								});
							} else if (id.endsWith(".hue")) {
								// TODO: transform HSL to RGB
								light.merge({
									hue: val,
									transitionTime: await getTransitionDuration(accessory),
								});
							} else if (id.endsWith(".saturation")) {
								light.merge({
									saturation: val,
									transitionTime: await getTransitionDuration(accessory),
								});
							} else if (id.endsWith(".transitionDuration")) {
								// TODO: check if we need to buffer this somehow
								// for now just ack the change
								await adapter.$setState(id, state, true);
								return;
							}
						}

						serializedObj = newAccessory.serialize(accessory); // serialize with the old object as a reference
						url = `${requestBase}${coapEndpoints.devices}/${rootObj.native.instanceId}`;
						break;
				}

				// If the serialized object contains no properties, we don't need to send anything
				if (!serializedObj || Object.keys(serializedObj).length === 0) {
					_.log("stateChange > empty object, not sending any payload", "debug");
					await adapter.$setState(id, state.val, true);
					return;
				}

				let payload: string | Buffer = JSON.stringify(serializedObj);
				_.log("stateChange > sending payload: " + payload, "debug");

				payload = Buffer.from(payload);
				coap.request(url, "put", payload);

			}
		} else if (!state) {
			// TODO: find out what to do when states are deleted
		}

		// Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
		try {
			for (const sub of customStateSubscriptions.subscriptions.values()) {
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
			// stop pinging
			if (pingTimer != null) clearInterval(pingTimer);

			// stop all observers
			for (const url of observers) {
				coap.stopObserving(url);
			}
			// close all sockets
			coap.reset();
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

/**
 * Clears the list of observers after a network reset
 */
function clearObservers(): void {
	observers.splice(0, observers.length);
}

function observeAll(): void {
	observeDevices();
	observeGroups();
}

/** Sets up an observer for all devices */
function observeDevices() {
	observeResource(
		coapEndpoints.devices,
		coapCb_getAllDevices,
	);
}
// gets called whenever "get /15001" updates
async function coapCb_getAllDevices(response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getAllDevices.`, "error");
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
	_.log(`adding devices with keys ${JSON.stringify(addedKeys)}`, "debug");

	const observeDevicePromises = newKeys.map(id => {
		return observeResource(
			`${coapEndpoints.devices}/${id}`,
			(resp) => coap_getDevice_cb(id, resp),
		);
	});
	await Promise.all(observeDevicePromises);

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing devices with keys ${JSON.stringify(removedKeys)}`, "debug");
	removedKeys.forEach(async (id) => {
		if (id in devices) {
			// delete ioBroker device
			const deviceName = calcObjName(devices[id]);
			await adapter.$deleteDevice(deviceName);
			// remove device from dictionary
			delete groups[id];
		}

		// remove observer
		stopObservingResource(`${coapEndpoints.devices}/${id}`);
	});

}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(instanceId: number, response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getDevice(${instanceId}).`, "error");
		return;
	}
	const result = parsePayload(response);
	// parse device info
	const accessory = new Accessory().parse(result).createProxy();
	// remember the device object, so we can later use it as a reference for updates
	devices[instanceId] = accessory;
	// create ioBroker device
	extendDevice(accessory);
}

/** Sets up an observer for all groups */
function observeGroups() {
	observeResource(
		coapEndpoints.groups,
		coapCb_getAllGroups,
	);
}
// gets called whenever "get /15004" updates
async function coapCb_getAllGroups(response: CoapResponse) {

	if (response.code.toString() !== "2.05") {
		_.log(`unexpected response (${response.code.toString()}) to getAllGroups.`, "error");
		return;
	}
	const newGroups = parsePayload(response);

	_.log(`got all groups: ${JSON.stringify(newGroups)}`);

	// get old keys as int array
	const oldKeys = Object.keys(groups).map(k => +k).sort();
	// get new keys as int array
	const newKeys = newGroups.sort();
	// translate that into added and removed devices
	const addedKeys = except(newKeys, oldKeys);
	_.log(`adding groups with keys ${JSON.stringify(addedKeys)}`, "debug");

	const observeGroupPromises = newKeys.map(id => {
		return observeResource(
			`${coapEndpoints.groups}/${id}`,
			(resp) => coap_getGroup_cb(id, resp),
		);
	});
	await Promise.all(observeGroupPromises);

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing groups with keys ${JSON.stringify(removedKeys)}`, "debug");
	removedKeys.forEach(async (id) => {
		if (id in groups) {
			// delete ioBroker group
			const groupName = calcGroupName(groups[id].group);
			await adapter.$deleteChannel(groupName);
			// remove group from dictionary
			delete groups[id];
		}

		// remove observer
		stopObservingResource(`${coapEndpoints.groups}/${id}`);
	});

}
// gets called whenever "get /15004/<instanceId>" updates
function coap_getGroup_cb(instanceId: number, response: CoapResponse) {

	// check response code
	switch (response.code.toString()) {
		case "2.05": break; // all good
		case "4.04": // not found
			// We know this group existed or we wouldn't have requested it
			// This means it has been deleted
			// TODO: Should we delete it here or where its being handled right now?
			return;
		default:
			_.log(`unexpected response (${response.code.toString()}) to getGroup(${instanceId}).`, "error");
			return;
	}

	const result = parsePayload(response);
	// parse group info
	const group = (new Group()).parse(result).createProxy();
	// remember the group object, so we can later use it as a reference for updates
	let groupInfo: GroupInfo;
	if (!(instanceId in groups)) {
		// if there's none, create one
		groups[instanceId] = {
			group: null,
			scenes: {},
		};
	}
	groupInfo = groups[instanceId];
	groupInfo.group = group;

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
		_.log(`unexpected response (${response.code.toString()}) to getAllScenes(${groupId}).`, "error");
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
	_.log(`adding scenes with keys ${JSON.stringify(addedKeys)} to group ${groupId}`, "debug");

	const observeScenePromises = newKeys.map(id => {
		return observeResource(
			`${coapEndpoints.scenes}/${groupId}/${id}`,
			(resp) => coap_getScene_cb(groupId, id, resp),
		);
	});
	await Promise.all(observeScenePromises);

	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing scenes with keys ${JSON.stringify(removedKeys)} from group ${groupId}`, "debug");
	removedKeys.forEach(id => {
		// remove scene from dictionary
		if (groupInfo.scenes.hasOwnProperty(id)) delete groupInfo.scenes[id];

		// remove observer
		stopObservingResource(`${coapEndpoints.scenes}/${groupId}/${id}`);
	});
	// Update the scene dropdown for the group
	updatePossibleScenes(groupInfo);
}

// gets called whenever "get /15005/<groupId>/<instanceId>" updates
function coap_getScene_cb(groupId: number, instanceId: number, response: CoapResponse) {

	// check response code
	switch (response.code.toString()) {
		case "2.05": break; // all good
		case "4.04": // not found
			// We know this scene existed or we wouldn't have requested it
			// This means it has been deleted
			// TODO: Should we delete it here or where its being handled right now?
			return;
		default:
			_.log(`unexpected response (${response.code.toString()}) to getScene(${groupId}, ${instanceId}).`, "error");
			return;
	}

	const result = parsePayload(response);
	// parse scene info
	const scene = (new Scene()).parse(result).createProxy();
	// remember the scene object, so we can later use it as a reference for updates
	groups[groupId].scenes[instanceId] = scene;
	// Update the scene dropdown for the group
	updatePossibleScenes(groups[groupId]);
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
function calcObjId(accessory: Accessory): string {
	return `${adapter.namespace}.${calcObjName(accessory)}`;
}
/**
 * Determines the object name under which the given group accessory be stored,
 * excluding the adapter namespace
 */
function calcObjName(accessory: Accessory): string {
	const prefix = (() => {
		switch (accessory.type) {
			case AccessoryTypes.remote:
				return "RC";
			case AccessoryTypes.lightbulb:
				return "L";
			default:
				_.log(`Unknown accessory type ${accessory.type}. Please send this info to the developer with a short description of the device!`, "warn");
				return "XYZ";
		}
	})();
	return `${prefix}-${accessory.instanceId}`;
}

/**
 * Determines the object ID under which the given group should be stored
 */
function calcGroupId(group: Group): string {
	return `${adapter.namespace}.${calcGroupName(group)}`;
}
/**
 * Determines the object name under which the given group should be stored,
 * excluding the adapter namespace
 */
function calcGroupName(group: Group): string {
	return `G-${group.instanceId}`;
}

/**
 * Determines the object ID under which the given scene should be stored
 */
function calcSceneId(scene: Scene): string {
	return `${adapter.namespace}.${calcSceneName(scene)}`;
}
/**
 * Determines the object name under which the given scene should be stored,
 * excluding the adapter namespace
 */
function calcSceneName(scene: Scene): string {
	return `S-${scene.instanceId}`;
}

/**
 * Returns the configured transition duration for an accessory or a group
 */
async function getTransitionDuration(accessoryOrGroup: Accessory | Group): Promise<number> {
	let stateId: string;
	if (accessoryOrGroup instanceof Accessory) {
		switch (accessoryOrGroup.type) {
			case AccessoryTypes.lightbulb:
				stateId = calcObjId(accessoryOrGroup) + ".lightbulb.transitionDuration";
		}
	} else if (accessoryOrGroup instanceof Group) {
		stateId = calcGroupId(accessoryOrGroup) + ".transitionDuration";
	}
	const ret = await adapter.$getState(stateId);
	if (ret != null) return ret.val;
	return 0.5; // default
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
				const newValue = dig<any>(accessory, obj.native.path);
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
			let channelName;
			let spectrum: Spectrum = "none";
			if (accessory.lightList != null && accessory.lightList.length > 0) {
				spectrum = accessory.lightList[0].spectrum;
			}
			if (spectrum === "none") {
				channelName = "Lightbulb";
			} else if (spectrum === "white") {
				channelName = "Lightbulb (white spectrum)";
			} else if (spectrum === "rgb") {
				channelName = "RGB Lightbulb";
			}
			// obj.lightbulb should be a channel
			stateObjs.lightbulb = {
				_id: `${objId}.lightbulb`,
				type: "channel",
				common: {
					name: channelName,
					role: "light",
				},
				native: {
					spectrum: spectrum, // remember the spectrum, so we can update different properties later
				},
			};
			if (spectrum === "white") {
				stateObjs["lightbulb.color"] = {
					_id: `${objId}.lightbulb.color`,
					type: "state",
					common: {
						name: "Color temperature",
						read: true,
						write: true,
						min: 0,
						max: 100,
						unit: "%",
						type: "number",
						role: "level.color.temperature",
						desc: "range: 0% = cold, 100% = warm",
					},
					native: {
						path: "lightList.[0].colorTemperature",
					},
				};
			} else if (spectrum === "rgb") {
				stateObjs["lightbulb.color"] = {
					_id: `${objId}.lightbulb.color`,
					type: "state",
					common: {
						name: "RGB color",
						read: true,
						write: true,
						type: "string",
						role: "level.color",
						desc: "6-digit RGB hex string",
					},
					native: {
						path: "lightList.[0].color",
					},
				};
				stateObjs["lightbulb.hue"] = {
					_id: `${objId}.lightbulb.hue`,
					type: "state",
					common: {
						name: "Color hue",
						read: true,
						write: true,
						min: 0,
						max: 360,
						unit: "°",
						type: "number",
						role: "level.color.hue",
					},
					native: {
						path: "lightList.[0].hue",
					},
				};
				stateObjs["lightbulb.saturation"] = {
					_id: `${objId}.lightbulb.saturation`,
					type: "state",
					common: {
						name: "Color saturation",
						read: true,
						write: true,
						min: 0,
						max: 100,
						unit: "%",
						type: "number",
						role: "level.color.saturation",
					},
					native: {
						path: "lightList.[0].saturation",
					},
				};
			}
			stateObjs["lightbulb.brightness"] = {
				_id: `${objId}.lightbulb.brightness`,
				type: "state",
				common: {
					name: "brightness",
					read: true,
					write: true,
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
					read: true,
					write: true,
					type: "boolean",
					role: "switch",
				},
				native: {
					path: "lightList.[0].onOff",
				},
			};
			stateObjs["lightbulb.transitionDuration"] = {
				_id: `${objId}.lightbulb.transitionDuration`,
				type: "state",
				common: {
					name: "Transition duration",
					read: true,
					write: true,
					type: "number",
					min: 0,
					max: 100, // TODO: check
					def: 0.5,
					role: "light.dimmer", // TODO: better role?
					desc: "Duration of a state change",
					unit: "s",
				},
				native: {
					path: "lightList.[0].transitionTime",
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
					initialValue = dig<any>(accessory, obj.native.path);
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
				const newValue = dig<any>(group, obj.native.path);
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
			transitionDuration: {
				_id: `${objId}.transitionDuration`,
				type: "state",
				common: {
					name: "Transition duration",
					read: false,
					write: true,
					type: "number",
					min: 0,
					max: 100, // TODO: check
					def: 0,
					role: "light.dimmer", // TODO: better role?
					desc: "Duration for brightness changes of this group's lightbulbs",
					unit: "s",
				},
				native: {
					path: "transitionTime",
				},
			},
			brightness: {
				_id: `${objId}.brightness`,
				type: "state",
				common: {
					name: "Brightness",
					read: false, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 254,
					type: "number",
					role: "light.dimmer",
					desc: "Brightness of this group's lightbulbs",
				},
				native: {
					path: "dimmer",
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
					initialValue = dig<any>(group, obj.native.path);
				}
				// create object and return the promise, so we can wait
				return adapter.$createOwnStateEx(stateId, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}

async function updatePossibleScenes(groupInfo: GroupInfo): Promise<void> {
	const group = groupInfo.group;
	// if this group is not in the dictionary, don't do anything
	if (!(group.instanceId in groups)) return;
	// find out which is the root object id
	const objId = calcGroupId(group);
	// scenes are stored under <objId>.activeScene
	const scenesId = `${objId}.activeScene`;

	// only extend that object if it exists already
	if (_.isdef(objects[scenesId])) {
		_.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);

		const activeSceneObj = objects[scenesId];
		const scenes = groupInfo.scenes;
		// map scene ids and names to the dropdown
		const states = composeObject(
			Object.keys(scenes).map(id => [id, scenes[id].name] as [string, string]),
		);
		const obj = await adapter.$getObject(scenesId) as ioBroker.StateObject;
		obj.common.states = states;
		await adapter.$setObject(scenesId, obj);
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
		_.log("renameDevice > empty object, not sending any payload", "debug");
		return;
	}

	// get the payload
	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("renameDevice > sending payload: " + payload, "debug");
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
		_.log("renameGroup > empty object, not sending any payload", "debug");
		return;
	}

	// get the payload
	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("renameDevice > sending payload: " + payload, "debug");
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

	customStateSubscriptions.subscriptions.set(id, { pattern, callback });

	return id;
}

/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id: string) {
	if (customStateSubscriptions.subscriptions.has(id)) {
		customStateSubscriptions.subscriptions.delete(id);
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

	customObjectSubscriptions.subscriptions.set(id, { pattern, callback });

	return id;
}

/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id: string) {
	if (customObjectSubscriptions.subscriptions.has(id)) {
		customObjectSubscriptions.subscriptions.delete(id);
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
			_.log(`unknown CoAP response format ${response.format}`, "warn");
			return response.payload;
	}
}

// Connection check
let pingTimer: NodeJS.Timer;
let connectionAlive: boolean = false;
let pingFails: number = 0;
let resetAttempts: number = 0;
let dead: boolean = false;
async function pingThread() {
	const oldValue = connectionAlive;
	connectionAlive = await coap.ping(requestBase);
	_.log(`ping ${connectionAlive ? "" : "un"}successful...`, "debug");
	await adapter.$setStateChanged("info.connection", connectionAlive, true);

	// see if the connection state has changed
	if (connectionAlive) {
		pingFails = 0;
		if (!oldValue) {
			// connection is now alive again
			_.log("Connection to gateway reestablished", "info");
			// restart observing if neccessary
			if (observers.length === 0) observeAll();
			// TODO: send buffered messages
		}
	} else {
		if (oldValue) {
			// connection is now dead
			_.log("Lost connection to gateway", "warn");
			// TODO: buffer messages
		}

		// Try to fix stuff by resetting the connection after a few failed pings
		pingFails++;
		if (pingFails >= 3) {
			if (resetAttempts < 3) {
				resetAttempts++;
				_.log(`3 consecutive pings failed, resetting connection (attempt #${resetAttempts})...`, "warn");
				pingFails = 0;
				coap.reset();
				// after a reset, our observers references are orphaned, clear them.
				clearObservers();
			} else {
				// not sure what to do here, try restarting the adapter
				_.log(`Three consecutive reset attempts failed!`, "error");
				_.log(`Please restart the adapter manually!`, "error");
				clearTimeout(pingTimer);
				dead = true;
			}
		}
	}
}

// Unbehandelte Fehler tracen
function getMessage(err: Error | string): string {
	// Irgendwo gibt es wohl einen Fehler ohne Message
	if (err == null) return "undefined";
	if (typeof err === "string") return err;
	if (err.message != null) return err.message;
	if (err.name != null) return err.name;
	return err.toString();
}
process.on("unhandledRejection", (err: Error) => {
	adapter.log.error("unhandled promise rejection: " + getMessage(err));
	if (err.stack != null) adapter.log.error("> stack: " + err.stack);
});
process.on("uncaughtException", (err: Error) => {
	adapter.log.error("unhandled exception:" + getMessage(err));
	if (err.stack != null) adapter.log.error("> stack: " + err.stack);
	process.exit(1);
});
