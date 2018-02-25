// tslint:disable:object-literal-key-quotes

// load tradfri data types
import {
	Accessory, AccessoryTypes,
	Group,
	LightOperation,
	Scene,
	TradfriClient,
	TradfriError,
	TradfriErrorCodes,
} from "node-tradfri-client";

// Eigene Module laden
import { ExtendedAdapter, Global as _ } from "./lib/global";
import { composeObject, entries, values } from "./lib/object-polyfill";
import { wait } from "./lib/promises";

// Datentypen laden
import { VirtualGroup } from "./lib/virtual-group";

// Adapter-Utils laden
import utils from "./lib/utils";

// Adapter-Module laden
import { normalizeHexColor } from "./lib/colors";
import { ensureInstanceObjects, fixAdapterObjects } from "./lib/fix-objects";
import { calcGroupId, calcGroupName, calcObjId, calcObjName, extendDevice, getInstanceId, getRootId, updatePossibleScenes } from "./lib/iobroker-objects";
import { applyCustomObjectSubscriptions, applyCustomStateSubscriptions, subscribeStates } from "./modules/custom-subscriptions";
import { extendGroup, syncGroupsWithState, updateGroupStates } from "./modules/groups";
import { onMessage } from "./modules/message";
import { operateVirtualGroup, renameDevice, renameGroup } from "./modules/operations";

import { roundTo } from "./lib/math";
import { session as $ } from "./modules/session";

// Adapter-Objekt erstellen
let adapter: ExtendedAdapter = utils.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: async () => {

		// Adapter-Instanz global machen
		adapter = _.extend(adapter);
		_.adapter = adapter;

		// Fix our adapter objects to repair incompatibilities between versions
		await ensureInstanceObjects();
		await fixAdapterObjects();

		// we're not connected yet!
		await adapter.setState("info.connection", false, true);

		// Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
		if (adapter.config
			&& adapter.config.host != null && adapter.config.host !== ""
			&& ((adapter.config.securityCode != null && adapter.config.securityCode !== "")
				|| (adapter.config.identity != null && adapter.config.identity !== "")
			)
		) {
			// alles gut
		} else {
			adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
			return;
		}

		// redirect console output
		// console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
		// console.error = (msg) => adapter.log.error("STDERR > " + msg);
		_.log(`startfile = ${process.argv[1]}`);

		// watch own states
		adapter.subscribeStates(`${adapter.namespace}.*`);
		adapter.subscribeObjects(`${adapter.namespace}.*`);
		// add special watch for lightbulb states, so we can later sync the group states
		subscribeStates(/L\-\d+\.lightbulb\./, syncGroupsWithState);

		// Auth-Parameter laden
		const hostname = (adapter.config.host as string).toLowerCase();
		const securityCode = (adapter.config.securityCode as string);
		let identity = (adapter.config.identity as string);
		let psk = (adapter.config.psk as string);

		$.tradfri = new TradfriClient(hostname, _.log);

		if (securityCode != null && securityCode.length > 0) {
			// we temporarily stored the security code to replace it with identity/psk
			try {
				({ identity, psk } = await $.tradfri.authenticate(securityCode));
				// store it and restart the adapter
				_.log(`The authentication was successful. The adapter should now restart. If not, please restart it manually.`, "info");
				await updateConfig({
					identity,
					psk,
					securityCode: "",
				});
			} catch (e) {
				if (e instanceof TradfriError) {
					switch (e.code) {
						case TradfriErrorCodes.ConnectionFailed: {
							_.log(`Could not connect to the gateway ${hostname}!`, "error");
							_.log(`Please check your network and adapter settings and restart the adapter!`, "error");
							return;
						}
						case TradfriErrorCodes.AuthenticationFailed: {
							_.log(`The authentication failed. An update of the adapter might be necessary`, "error");
							return;
						}
					}
				} else {
					_.log(`Could not connect to the gateway ${hostname}!`, "error");
					_.log(e.message, "error");
					return;
				}
			}
		} else {
			// connect with previously negotiated identity and psk
			if (!await $.tradfri.connect(identity, psk)) {
				_.log(`Could not connect to the gateway ${hostname}!`, "error");
				_.log(`Please check your network and adapter settings and restart the adapter!`, "error");
				_.log(`If the settings are correct, consider re-authentication in the adapter config.`, "error");
				return;
			}
		}

		await adapter.$setState("info.connection", true, true);
		connectionAlive = true;
		pingTimer = setInterval(pingThread, 10000);

		await loadDevices();
		await loadGroups();
		await loadVirtualGroups();

		$.tradfri
			.on("device updated", tradfri_deviceUpdated)
			.on("device removed", tradfri_deviceRemoved)
			.on("group updated", tradfri_groupUpdated)
			.on("group removed", tradfri_groupRemoved)
			.on("scene updated", tradfri_sceneUpdated)
			.on("scene removed", tradfri_sceneRemoved)
			;
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
				if (obj.type === "device" && instanceId in $.devices && $.devices[instanceId] != null) {
					// if this device is in the device list, check for changed properties
					const acc = $.devices[instanceId];
					if (obj.common && obj.common.name !== acc.name) {
						// the name has changed, notify the gateway
						_.log(`the device ${id} was renamed to "${obj.common.name}"`);
						renameDevice(acc, obj.common.name);
					}
				} else if (obj.type === "channel" && instanceId in $.groups && $.groups[instanceId] != null) {
					// if this group is in the groups list, check for changed properties
					const grp = $.groups[instanceId].group;
					if (obj.common && obj.common.name !== grp.name) {
						// the name has changed, notify the gateway
						_.log(`the group ${id} was renamed to "${obj.common.name}"`);
						renameGroup(grp, obj.common.name);
					}
				}
				// remember the object
				$.objects[id] = obj;
			} else {
				// object deleted, forget it
				if (id in $.objects) delete $.objects[id];
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

			const stateObj = $.objects[id];
			if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path)) return;

			// get "official" value for the parent object
			const rootId = getRootId(id);
			if (rootId) {
				// get the ioBroker object
				const rootObj = $.objects[rootId];

				// for now: handle changes on a case by case basis
				// everything else is too complicated for now
				let val = state.val;
				if (stateObj.common.type === "number") {
					// node-tradfri-client handles floating point numbers,
					// but we'll round to 2 digits for clarity
					val = roundTo(val, 2);
					if (stateObj.common.min != null) val = Math.max(stateObj.common.min, val);
					if (stateObj.common.max != null) val = Math.min(stateObj.common.max, val);
				}

				switch (rootObj.native.type) {
					case "group": {
						// read the instanceId and get a reference value
						const group = $.groups[rootObj.native.instanceId].group;
						// if the change was acknowledged, update the state later
						let wasAcked: boolean;

						if (id.endsWith(".state")) {
							wasAcked = !await group.toggle(val);
						} else if (id.endsWith(".brightness")) {
							wasAcked = !await group.setBrightness(
								val,
								await getTransitionDuration(group),
							);
						} else if (id.endsWith(".activeScene")) {
							// turn on and activate a scene
							wasAcked = !await group.activateScene(val);
						} else if (id.endsWith(".color")) {
							// color change is only supported manually, so we operate
							// the virtual state of this group
							val = normalizeHexColor(val);
							if (val != null) {
								state.val = val;
								await operateVirtualGroup(group, {
									color: val,
									transitionTime: await getTransitionDuration(group),
								});
								wasAcked = true;
							}
						} else if (id.endsWith(".colorTemperature")) {
							// color change is only supported manually, so we operate
							// the virtual state of this group
							await operateVirtualGroup(group, {
								colorTemperature: val,
								transitionTime: await getTransitionDuration(group),
							});
							wasAcked = true;
						} else if (/\.(hue|saturation)$/.test(id)) {
							// hue and saturation have to be set together
							const prefix = id.substr(0, id.lastIndexOf(".") + 1);
							const hue = (await _.adapter.$getState(prefix + "hue")).val;
							const saturation = (await _.adapter.$getState(prefix + "saturation")).val;
							// color change is only supported manually, so we operate
							// the virtual state of this group
							await operateVirtualGroup(group, {
								hue,
								saturation,
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
						const vGroup = $.virtualGroups[rootObj.native.instanceId];

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
						} else if (id.endsWith(".colorTemperature")) {
							operation = {
								colorTemperature: val,
								transitionTime: await getTransitionDuration(vGroup),
							};
						} else if (/\.(hue|saturation)$/.test(id)) {
							// hue and saturation have to be set together
							const prefix = id.substr(0, id.lastIndexOf(".") + 1);
							const hue = (await _.adapter.$getState(prefix + "hue")).val;
							const saturation = (await _.adapter.$getState(prefix + "saturation")).val;
							operation = {
								hue,
								saturation,
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
							const accessory = $.devices[rootObj.native.instanceId];
							const light = accessory.lightList[0];
							// if the change was acknowledged, update the state later
							let wasAcked: boolean;

							// operate the lights depending on the set state
							// if no request was sent, we can ack the state immediately
							if (id.endsWith(".state")) {
								wasAcked = !await light.toggle(val);
							} else if (id.endsWith(".brightness")) {
								wasAcked = !await light.setBrightness(
									val,
									await getTransitionDuration(accessory),
								);
							} else if (id.endsWith(".color")) {
								// we need to differentiate here, because some ppl
								// might already have "color" states for white spectrum bulbs
								// in the future, we create different states for white and RGB bulbs
								if (light.spectrum === "rgb") {
									val = normalizeHexColor(val);
									if (val != null) {
										state.val = val;
										wasAcked = !await light.setColor(
											val,
											await getTransitionDuration(accessory),
										);
									}
								} else if (light.spectrum === "white") {
									wasAcked = !await light.setColorTemperature(
										val,
										await getTransitionDuration(accessory),
									);
								}
							} else if (id.endsWith(".colorTemperature")) {
								wasAcked = !await light.setColorTemperature(
									val,
									await getTransitionDuration(accessory),
								);
							} else if (/\.(hue|saturation)$/.test(id)) {
								// hue and saturation have to be set together
								const prefix = id.substr(0, id.lastIndexOf(".") + 1);
								const hue = (await _.adapter.$getState(prefix + "hue")).val;
								const saturation = (await _.adapter.$getState(prefix + "saturation")).val;
								wasAcked = !await $.tradfri.operateLight(accessory, {
									hue,
									saturation,
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

			// close the gateway connection
			$.tradfri.destroy();
			adapter.setState("info.connection", false, true);

			callback();
		} catch (e) {
			callback();
		}
	},
}) as ExtendedAdapter;

async function updateConfig(newConfig: Record<string, any>) {
	// Create the config object
	let config: Record<string, any> = Object.assign({}, adapter.config);
	config = Object.assign(config, newConfig);
	// Update the adapter object
	const adapterObj = await adapter.$getForeignObject(`system.adapter.${adapter.namespace}`);
	adapterObj.native = config;
	await adapter.$setForeignObject(`system.adapter.${adapter.namespace}`, adapterObj);
}

// ==================================
// manage devices

async function observeAll(): Promise<void> {
	await $.tradfri.observeDevices();
	_.log("received all devices");
	await $.tradfri.observeGroupsAndScenes();
	_.log("received all groups and scenes");
}

function tradfri_deviceUpdated(device: Accessory) {
	// remember it
	$.devices[device.instanceId] = device;
	// create ioBroker device
	extendDevice(device);
}

async function tradfri_deviceRemoved(instanceId: number) {
	if (instanceId in $.devices) {
		// delete ioBroker device
		const deviceName = calcObjName($.devices[instanceId]);
		await adapter.$deleteDevice(deviceName);
		delete $.devices[instanceId];
	}
}

async function tradfri_groupUpdated(group: Group) {
	// remember the group
	if (!(group.instanceId in $.groups)) {
		// if there's none, create one
		$.groups[group.instanceId] = {
			group: null,
			scenes: {},
		};
	}
	$.groups[group.instanceId].group = group;
	// create ioBroker device
	extendGroup(group);
	// clean up any states that might be incorrectly defined
	updateGroupStates(group);
	// read the transition duration, because the gateway won't report it
	group.transitionTime = await getTransitionDuration(group);
}

async function tradfri_groupRemoved(instanceId: number) {
	if (instanceId in $.groups) {
		// delete ioBroker group
		const groupName = calcGroupName($.groups[instanceId].group);
		await adapter.$deleteChannel(groupName);
		// remove group from dictionary
		delete $.groups[instanceId];
	}
}

function tradfri_sceneUpdated(groupId: number, scene: Scene) {
	if (groupId in $.groups) {
		// remember the scene object, so we can later use it as a reference for updates
		$.groups[groupId].scenes[scene.instanceId] = scene;
		// Update the scene dropdown for the group
		updatePossibleScenes($.groups[groupId]);
	}
}

function tradfri_sceneRemoved(groupId: number, instanceId: number) {
	if (groupId in $.groups) {
		const groupInfo = $.groups[groupId];
		// remove scene from dictionary
		if (instanceId in groupInfo.scenes) delete groupInfo.scenes[instanceId];
	}
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
		return g.native != null &&
			g.native.instanceId != null &&
			g.native.deviceIDs != null &&
			g.native.type === "virtual group";
	});
	// load them into the virtualGroups dict
	Object.assign($.virtualGroups, composeObject<VirtualGroup>(
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
	for (const obj of values($.virtualGroups)) {
		const id = calcGroupId(obj);
		$.objects[id] = iobObjects[id];
		// also remember all states
		const stateObjs = await _.$$(`${id}.*`, "state");
		for (const [sid, sobj] of entries(stateObjs)) {
			$.objects[sid] = sobj;
		}
	}

}

/**
 * Loads defined devices from the ioBroker objects DB
 */
async function loadDevices(): Promise<void> {
	// find all defined devices
	const iobObjects = await _.$$(`${adapter.namespace}.*`, "device");
	const deviceObjects: ioBroker.Object[] = values(iobObjects).filter(d => {
		return d.native &&
			d.native.instanceId != null;
	});
	// remember the actual objects
	for (const obj of deviceObjects) {
		$.objects[obj._id] = obj;
		// also remember all states
		const stateObjs = await _.$$(`${obj._id}.*`, "state");
		for (const [sid, sobj] of entries(stateObjs)) {
			$.objects[sid] = sobj;
		}
	}
}

/**
 * Loads defined devices from the ioBroker objects DB
 */
async function loadGroups(): Promise<void> {
	// find all defined groups
	const iobObjects = await _.$$(`${adapter.namespace}.G-*`, "channel");
	const groupObjects: ioBroker.Object[] = values(iobObjects).filter(g => {
		return g.native &&
			g.native.instanceId != null &&
			g.native.type === "group";
	});
	// remember the actual objects
	for (const obj of groupObjects) {
		$.objects[obj._id] = obj;
		// also remember all states
		const stateObjs = await _.$$(`${obj._id}.*`, "state");
		for (const [sid, sobj] of entries(stateObjs)) {
			$.objects[sid] = sobj;
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
	connectionAlive = await $.tradfri.ping();
	_.log(`ping ${connectionAlive ? "" : "un"}successful...`, "debug");
	await adapter.$setStateChanged("info.connection", connectionAlive, true);

	// see if the connection state has changed
	if (connectionAlive) {
		pingFails = 0;
		if (!oldValue) {
			// connection is now alive again
			_.log("Connection to gateway reestablished", "info");
			// restart observing if neccessary
			observeAll();
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

				$.tradfri.reset();
			} else {
				// not sure what to do here, try restarting the adapter
				_.log(`Three consecutive reset attempts failed!`, "error");
				_.log(`Restarting the adapter in 10 seconds!`, "error");
				clearTimeout(pingTimer);
				dead = true;
				setTimeout(() => {
					// updating the config restarts the adapter
					// so we have to provide an empty object to not override anything
					updateConfig({});
				}, 10000);
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
