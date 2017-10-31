// tslint:disable:object-literal-key-quotes

// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

// Eigene Module laden
import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { endpoints as coapEndpoints} from "./ipso/endpoints";
import { except } from "./lib/array-extensions";
import { parsePayload } from "./lib/coap-payload";
import { ExtendedAdapter, Global as _ } from "./lib/global";
import { composeObject, DictionaryLike, dig, entries, filter, values } from "./lib/object-polyfill";
import { wait } from "./lib/promises";

// Datentypen laden
import { Accessory, AccessoryTypes } from "./ipso/accessory";
import { Group } from "./ipso/group";
import { LightOperation, Spectrum } from "./ipso/light";
import { Scene } from "./ipso/scene";
import { VirtualGroup } from "./lib/virtual-group";

// Adapter-Utils laden
import utils from "./lib/utils";

// Adapter-Module laden
import { normalizeHexColor } from "./lib/colors";
import { ensureInstanceObjects, fixAdapterObjects } from "./lib/fix-objects";
import { calcGroupId, calcGroupName, calcObjId, calcObjName, extendDevice, getInstanceId, getRootId, updatePossibleScenes } from "./lib/iobroker-objects";
import { applyCustomObjectSubscriptions, applyCustomStateSubscriptions, subscribeStates } from "./modules/custom-subscriptions";
import { gateway as gw, GroupInfo } from "./modules/gateway";
import { extendGroup, syncGroupsWithState, updateGroupStates, updateMultipleGroupStates } from "./modules/groups";
import { onMessage } from "./modules/message";
import { operateGroup, operateLight, operateVirtualGroup, renameDevice, renameGroup } from "./modules/operations";

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

		// redirect console output
		// console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
		// console.error = (msg) => adapter.log.error("STDERR > " + msg);
		_.log(`startfile = ${process.argv[1]}`);

		// Fix our adapter objects to repair incompatibilities between versions
		await ensureInstanceObjects();
		await fixAdapterObjects();

		// watch own states
		adapter.subscribeStates(`${adapter.namespace}.*`);
		adapter.subscribeObjects(`${adapter.namespace}.*`);
		// add special watch for lightbulb states, so we can later sync the group states
		subscribeStates(/L\-\d+\.lightbulb\./, syncGroupsWithState);

		const hostname = (adapter.config.host as string).toLowerCase();
		gw.requestBase = `coaps://${hostname}:5684/`;

		// TODO: make this more elegant when I have the time
		// we're reconnecting a bit too much

		// first, check try to connect with the security code
		_.log("trying to connect with the security code", "debug");
		if (!await connect(hostname, "Client_identity", adapter.config.securityCode)) {
			// that didn't work, so the code is wrong
			return;
		}
		// now, if we have a stored identity, try to connect with that one
		const identity = await adapter.$getState("info.identity");
		const identityObj = await adapter.$getObject("info.identity");
		let needsAuthentication: boolean;
		if (identity == null || !("psk" in identityObj.native) || typeof identityObj.native.psk !== "string" || identityObj.native.psk.length === 0) {
			_.log("no identity stored, creating a new one", "debug");
			needsAuthentication = true;
		} else if (!await connect(hostname, identity.val, identityObj.native.psk)) {
			_.log("stored identity has expired, creating a new one", "debug");
			// either there was no stored identity, or the current one is expired,
			// so we need to get a new one
			// delete the old one first
			await adapter.$setState("info.identity", "", true);
			if ("psk" in identityObj.native) {
				delete identityObj.native.psk;
				await adapter.$setObject("info.identity", identityObj);
			}
			needsAuthentication = true;
			// therefore, reconnect with the working security code
			await connect(hostname, "Client_identity", adapter.config.securityCode);
		}
		if (needsAuthentication) {
			const authResult = await authenticate();
			if (authResult == null) {
				_.log("authentication failed", "error");
				return;
			}
			_.log(`reconnecting with the new identity`, "debug");
			if (!await connect(hostname, authResult.identity, authResult.psk)) {
				_.log("connection with fresh identity failed", "error");
				return;
			}
		}

		await adapter.$setState("info.connection", true, true);
		connectionAlive = true;
		pingTimer = setInterval(pingThread, 10000);

		loadVirtualGroups();
		// TODO: load known devices from ioBroker into <devices> & <objects>
		observeAll();

	},

	// Handle sendTo-Messages
	message: onMessage,

	objectChange: (id, obj) => {
		_.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, "debug");

		if (id.startsWith(adapter.namespace)) {
			// this is our own object.

			if (obj) {
				// first check if we have to modify a device/group/whatever
				const instanceId = getInstanceId(id);
				if (obj.type === "device" && instanceId in gw.devices && gw.devices[instanceId] != null) {
					// if this device is in the device list, check for changed properties
					const acc = gw.devices[instanceId];
					if (obj.common && obj.common.name !== acc.name) {
						// the name has changed, notify the gateway
						_.log(`the device ${id} was renamed to "${obj.common.name}"`);
						renameDevice(acc, obj.common.name);
					}
				} else if (obj.type === "channel" && instanceId in gw.groups && gw.groups[instanceId] != null) {
					// if this group is in the groups list, check for changed properties
					const grp = gw.groups[instanceId].group;
					if (obj.common && obj.common.name !== grp.name) {
						// the name has changed, notify the gateway
						_.log(`the group ${id} was renamed to "${obj.common.name}"`);
						renameGroup(grp, obj.common.name);
					}
				}
				// remember the object
				gw.objects[id] = obj;
			} else {
				// object deleted, forget it
				if (id in gw.objects) delete gw.objects[id];
			}

		}

		// apply additional subscriptions we've defined
		applyCustomObjectSubscriptions(id, obj);

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

		// apply additional subscriptions we've defined
		applyCustomStateSubscriptions(id, state);

		// Eigene Handling-Logik zum Schluss, damit wir return benutzen können
		if (state && !state.ack && id.startsWith(adapter.namespace)) {
			// our own state was changed from within ioBroker, react to it

			const stateObj = gw.objects[id];
			if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path)) return;

			// get "official" value for the parent object
			const rootId = getRootId(id);
			if (rootId) {
				// get the ioBroker object
				const rootObj = gw.objects[rootId];

				// for now: handle changes on a case by case basis
				// everything else is too complicated for now
				let val = state.val;
				// make sure we have whole numbers
				if (stateObj.common.type === "number") {
					val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
					if (stateObj.common.min != null) val = Math.max(stateObj.common.min, val);
					if (stateObj.common.max != null) val = Math.min(stateObj.common.max, val);
				}

				switch (rootObj.native.type) {
					case "group": {
						// read the instanceId and get a reference value
						const group = gw.groups[rootObj.native.instanceId].group;
						// if the change was acknowledged, update the state later
						let wasAcked: boolean;

						if (id.endsWith(".state")) {
							wasAcked = !await operateGroup(group, {
								onOff: val,
							});
						} else if (id.endsWith(".brightness")) {
							wasAcked = !await operateGroup(group, {
								dimmer: val,
								transitionTime: await getTransitionDuration(group),
							});
						} else if (id.endsWith(".activeScene")) {
							// turn on and activate a scene
							wasAcked = !await operateGroup(group, {
								onOff: true,
								sceneId: val,
							});
						} else if (id.endsWith(".color")) {
							val = normalizeHexColor(val);
							if (val != null) {
								state.val = val;
								await operateVirtualGroup(group, {
									color: val,
									transitionTime: await getTransitionDuration(group),
								});
								wasAcked = true;
							}
						} else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
							// color change is only supported manually, so we operate
							// the virtual state of this group
							await operateVirtualGroup(group, {
								[id.substr(id.lastIndexOf(".") + 1)]: val,
								transitionTime: await getTransitionDuration(group),
							});
							wasAcked = true;
						} else if (id.endsWith(".transitionDuration")) {
							// this is part of another operation, just ack the state
							wasAcked = true;
						}

						// ack the state if neccessary and return
						if (wasAcked) adapter.$setState(id, state, true);
						return;
					}

					case "virtual group": {
						// find the virtual group instance
						const vGroup = gw.virtualGroups[rootObj.native.instanceId];

						let operation: LightOperation;
						let wasAcked: boolean = false;

						if (id.endsWith(".state")) {
							operation = {
								onOff: val,
							};
						} else if (id.endsWith(".brightness")) {
							operation = {
								dimmer: val,
								transitionTime: await getTransitionDuration(vGroup),
							};
						} else if (id.endsWith(".color")) {
							val = normalizeHexColor(val);
							if (val != null) {
								state.val = val;
								operation = {
									color: val,
									transitionTime: await getTransitionDuration(vGroup),
								};
							}
						} else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
							operation = {
								[id.substr(id.lastIndexOf(".") + 1)]: val,
								transitionTime: await getTransitionDuration(vGroup),
							};
						} else if (id.endsWith(".transitionDuration")) {
							// No operation here, since this is part of another one
							wasAcked = true;
						}

						// update all lightbulbs in this group
						if (operation != null) {
							operateVirtualGroup(vGroup, operation);
							wasAcked = true;
						}

						// and ack the state change
						if (wasAcked) adapter.$setState(id, state, true);
						return;
					}

					default: { // accessory

						if (id.indexOf(".lightbulb.") > -1) {
							// read the instanceId and get a reference value
							const accessory = gw.devices[rootObj.native.instanceId];
							const light = accessory.lightList[0];
							// if the change was acknowledged, update the state later
							let wasAcked: boolean;

							// operate the lights depending on the set state
							// if no request was sent, we can ack the state immediately
							if (id.endsWith(".state")) {
								wasAcked = !await operateLight(accessory, {
									onOff: val,
								});
							} else if (id.endsWith(".brightness")) {
								wasAcked = !await operateLight(accessory, {
									dimmer: val,
									transitionTime: await getTransitionDuration(accessory),
								});
							} else if (id.endsWith(".color")) {
								// we need to differentiate here, because some ppl
								// might already have "color" states for white spectrum bulbs
								// in the future, we create different states for white and RGB bulbs
								if (light.spectrum === "rgb") {
									val = normalizeHexColor(val);
									if (val != null) {
										state.val = val;
										wasAcked = !await operateLight(accessory, {
											color: val,
											transitionTime: await getTransitionDuration(accessory),
										});
									}
								} else if (light.spectrum === "white") {
									wasAcked = !await operateLight(accessory, {
										colorTemperature: val,
										transitionTime: await getTransitionDuration(accessory),
									});
								}
							} else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
								wasAcked = !await operateLight(accessory, {
									[id.substr(id.lastIndexOf(".") + 1)]: val,
									transitionTime: await getTransitionDuration(accessory),
								});
							} else if (id.endsWith(".transitionDuration")) {
								// this is part of another operation, just ack the state
								wasAcked = true;
							}

							// ack the state if neccessary and return
							if (wasAcked) adapter.$setState(id, state, true);
							return;
						}
					}
				}
			}
		} else if (!state) {
			// TODO: find out what to do when states are deleted
		}

	},

	unload: (callback) => {
		// is called when adapter shuts down - callback has to be called under any circumstances!
		try {
			// stop pinging
			if (pingTimer != null) clearInterval(pingTimer);

			// stop all observers
			for (const url of gw.observers) {
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

async function connect(hostname: string, identity: string, code: string): Promise<boolean> {
	// initialize CoAP client
	coap.reset();
	coap.setSecurityParams(hostname, {
		psk: { [identity]: code },
	});

	_.log(`Connecting to gateway ${hostname}, identity = ${identity}, psk = ${code}`, "debug");

	// Try a few times to setup a working connection
	const maxTries = 3;
	for (let i = 1; i <= maxTries; i++) {
		if (await coap.tryToConnect(gw.requestBase)) {
			break; // it worked
		} else if (i < maxTries) {
			_.log(`Could not connect to gateway, try #${i}`, "warn");
			await wait(1000);
		} else if (i === maxTries) {
			// no working connection
			_.log(`Could not connect to the gateway ${gw.requestBase} after ${maxTries} tries!`, "error");
			_.log(`Please check your network and adapter settings and restart the adapter!`, "error");
			return false;
		}
	}

	return true;
}

async function authenticate(): Promise<{identity: string, psk: string}> {
	// generate a new identity
	const identity = `tradfri_${Date.now()}`;

	_.log(`authenticating with identity "${identity}"`, "debug");

	// request creation of new PSK
	let payload: string | Buffer = JSON.stringify({ 9090: identity });
	payload = Buffer.from(payload);
	const response = await coap.request(
		`${gw.requestBase}${coapEndpoints.authentication}`,
		"post",
		payload,
	);

	// check the response
	if (response.code.toString() !== "2.01") {
		_.log(`unexpected response (${response.code.toString()}) to getPSK().`, "error");
		return null;
	}
	// the response is a buffer containing a JSON object as a string
	const pskResponse = JSON.parse(response.payload.toString("utf8"));
	const psk = pskResponse["9091"];

	// remember the identity/psk
	await adapter.$setState("info.identity", identity, true);
	const identityObj = await adapter.$getObject("info.identity");
	identityObj.native.psk = psk;
	await adapter.$setObject("info.identity", identityObj);

	// and return it
	return {identity, psk};
}

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
	const observerUrl = `${gw.requestBase}${path}`;
	if (gw.observers.indexOf(observerUrl) > -1) return;

	// start observing
	gw.observers.push(observerUrl);
	return coap.observe(observerUrl, "get", callback);
}

/**
 * Stops observing a resource
 * @param path The path of the resource (without requestBase)
 */
function stopObservingResource(path: string): void {

	path = normalizeResourcePath(path);

	// remove observer
	const observerUrl = `${gw.requestBase}${path}`;
	const index = gw.observers.indexOf(observerUrl);
	if (index === -1) return;

	coap.stopObserving(observerUrl);
	gw.observers.splice(index, 1);
}

/**
 * Clears the list of gw.observers after a network reset
 */
function clearObservers(): void {
	gw.observers.splice(0, gw.observers.length);
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
	const oldKeys = Object.keys(gw.devices).map(k => +k).sort();
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
		if (id in gw.devices) {
			// delete ioBroker device
			const deviceName = calcObjName(gw.devices[id]);
			await adapter.$deleteDevice(deviceName);
			// remove device from dictionary
			delete gw.devices[id];
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
	gw.devices[instanceId] = accessory;
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
	const oldKeys = Object.keys(gw.groups).map(k => +k).sort();
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
		if (id in gw.groups) {
			// delete ioBroker group
			const groupName = calcGroupName(gw.groups[id].group);
			await adapter.$deleteChannel(groupName);
			// remove group from dictionary
			delete gw.groups[id];
		}

		// remove observer
		stopObservingResource(`${coapEndpoints.groups}/${id}`);
	});

}
// gets called whenever "get /15004/<instanceId>" updates
async function coap_getGroup_cb(instanceId: number, response: CoapResponse) {

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
	if (!(instanceId in gw.groups)) {
		// if there's none, create one
		gw.groups[instanceId] = {
			group: null,
			scenes: {},
		};
	}
	groupInfo = gw.groups[instanceId];
	groupInfo.group = group;

	// create ioBroker states
	extendGroup(group);
	// clean up any states that might be incorrectly defined
	updateGroupStates(group);
	// read the transition duration, because the gateway won't report it
	group.transitionTime = await getTransitionDuration(group);
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

	const groupInfo = gw.groups[groupId];
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
	gw.groups[groupId].scenes[instanceId] = scene;
	// Update the scene dropdown for the group
	updatePossibleScenes(gw.groups[groupId]);
}

/**
 * Returns the configured transition duration for an accessory or a group
 */
async function getTransitionDuration(accessoryOrGroup: Accessory | Group | VirtualGroup): Promise<number> {
	let stateId: string;
	if (accessoryOrGroup instanceof Accessory) {
		switch (accessoryOrGroup.type) {
			case AccessoryTypes.lightbulb:
				stateId = calcObjId(accessoryOrGroup) + ".lightbulb.transitionDuration";
		}
	} else if (accessoryOrGroup instanceof Group || accessoryOrGroup instanceof VirtualGroup) {
		stateId = calcGroupId(accessoryOrGroup) + ".transitionDuration";
	}
	const ret = await adapter.$getState(stateId);
	if (ret != null) return ret.val;
	return 0.5; // default
}

/**
 * Loads defined virtual groups from the ioBroker objects DB
 */
async function loadVirtualGroups(): Promise<void> {
	// find all defined virtual groups
	const iobObjects = await _.$$(`${adapter.namespace}.VG-*`, "channel");
	const groupObjects: ioBroker.Object[] = values(iobObjects).filter(g => {
		return g.native &&
			g.native.instanceId != null &&
			g.native.type === "virtual group";
	});
	// load them into the virtualGroups dict
	Object.assign(gw.virtualGroups, composeObject<VirtualGroup>(
		groupObjects.map(g => {
			const id: number = g.native.instanceId;
			const deviceIDs: number[] = g.native.deviceIDs.map(d => parseInt(d, 10));
			const ret = new VirtualGroup(id);
			ret.deviceIDs = deviceIDs;
			ret.name = g.common.name;
			return [`${id}`, ret] as [string, VirtualGroup];
		}),
	));
	// remember the actual objects
	for (const obj of values(gw.virtualGroups)) {
		const id = calcGroupId(obj);
		gw.objects[id] = iobObjects[id];
		// also remember all states
		const stateObjs = await _.$$(`${id}.*`, "state");
		for (const [sid, sobj] of entries(stateObjs)) {
			gw.objects[sid] = sobj;
		}
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
	connectionAlive = await coap.ping(gw.requestBase);
	_.log(`ping ${connectionAlive ? "" : "un"}successful...`, "debug");
	await adapter.$setStateChanged("info.connection", connectionAlive, true);

	// see if the connection state has changed
	if (connectionAlive) {
		pingFails = 0;
		if (!oldValue) {
			// connection is now alive again
			_.log("Connection to gateway reestablished", "info");
			// restart observing if neccessary
			if (gw.observers.length === 0) observeAll();
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
