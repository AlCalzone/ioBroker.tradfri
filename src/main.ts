// tslint:disable:object-literal-key-quotes
import * as path from "path";

// actually load them now
import {
	Accessory, AccessoryTypes,
	discoverGateway,
	Group,
	Light,
	LightOperation,
	Plug,
	Scene,
	TradfriClient,
	TradfriError,
	TradfriErrorCodes,
	BlindOperation,
	Blind,
	PlugOperation,
} from "node-tradfri-client";

// Eigene Module laden
import { composeObject, entries, values } from "alcalzone-shared/objects";
import { ExtendedAdapter, Global as _ } from "./lib/global";

// Datentypen laden
import { VirtualGroup } from "./lib/virtual-group";

// Adapter-Utils laden
import * as utils from "@iobroker/adapter-core";

// Adapter-Module laden
import { normalizeHexColor } from "./lib/colors";
import { ensureInstanceObjects, fixAdapterObjects } from "./lib/fix-objects";
import { calcGroupId, calcGroupName, calcObjId, calcObjName, extendDevice, getInstanceId, getRootId, updatePossibleScenes } from "./lib/iobroker-objects";
import { applyCustomObjectSubscriptions, applyCustomStateSubscriptions, subscribeStates } from "./modules/custom-subscriptions";
import { extendGroup, syncGroupsWithState, updateGroupStates } from "./modules/groups";
import { onMessage } from "./modules/message";
import { operateVirtualGroup, renameDevice, renameGroup, stopBlinds } from "./modules/operations";

import { assertNever } from "alcalzone-shared/helpers";
import { roundTo } from "./lib/math";
import { session as $ } from "./modules/session";

let connectionAlive: boolean;
let adapter: ExtendedAdapter;

function startAdapter(options: Partial<utils.AdapterOptions> = {}) {
	return adapter = utils.adapter({
		// Default options
		...options,
		// custom options
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
			await adapter.setStateAsync("info.connection", false, true);

			// Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
			if (adapter.config
				&& ((adapter.config.host != null && adapter.config.host !== "")
					|| adapter.config.discoverGateway
				) && ((adapter.config.securityCode != null && adapter.config.securityCode !== "")
					|| (adapter.config.identity != null && adapter.config.identity !== "")
				)
			) {
				// alles gut
			} else {
				adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
				return;
			}

			// Auth-Parameter laden
			let hostname = adapter.config.host && adapter.config.host.toLowerCase();
			const useAutoDiscovery = adapter.config.discoverGateway;
			const securityCode = adapter.config.securityCode;
			let identity = adapter.config.identity;
			let psk = adapter.config.psk;

			if (useAutoDiscovery) {
				_.log("Discovering the gateway automatically...");
				const discovered = await discoverGateway();
				if (discovered && discovered.addresses.length) {
					_.log(`Found gateway ${discovered.name || "with unknown name"} at ${discovered.addresses[0]}`);
					hostname = discovered.addresses[0];
				} else {
					_.log("discovery failed!", "warn");
					if (!hostname) {
						adapter.log.error("In order to use this adapter without auto-discovery, please set a hostname!");
						return;
					}
				}
			}

			// Sicherstellen, dass die Anzahl der Nachkommastellen eine Zahl ist
			if (typeof adapter.config.roundToDigits === "string") {
				await updateConfig({
					roundToDigits: parseInt(adapter.config.roundToDigits, 10),
				});
			}

			// redirect console output
			// console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
			// console.error = (msg) => adapter.log.error("STDERR > " + msg);

			// watch own states
			adapter.subscribeStates(`${adapter.namespace}.*`);
			adapter.subscribeObjects(`${adapter.namespace}.*`);
			// add special watch for lightbulb and blind states, so we can later sync the group states
			subscribeStates(/L\-\d+\.lightbulb\./, syncGroupsWithState);
			subscribeStates(/B\-\d+\.blind\./, syncGroupsWithState);

			$.tradfri = new TradfriClient(hostname!, {
				customLogger: _.log,
				watchConnection: true,
			});

			if (identity && identity.length > 0 && psk && psk.length > 0) {
				// connect with previously negotiated identity and psk
				$.tradfri.on("connection failed", (attempt: number, maxAttempts: number) => {
					_.log(`failed connection attempt ${attempt} of ${Number.isFinite(maxAttempts) ? maxAttempts : "∞"}`, "warn");
				});

				try {
					await $.tradfri.connect(identity!, psk!);
				} catch (e) {
					if (e instanceof TradfriError) {
						switch (e.code) {
							case TradfriErrorCodes.ConnectionTimedOut: {
								_.log(`The gateway ${hostname} is unreachable or did not respond in time!`, "error");
								_.log(`Please check your network and adapter settings and restart the adapter!`, "error");
							}
							case TradfriErrorCodes.AuthenticationFailed: {
								_.log(`The stored credentials are no longer valid!`, "warn");
								_.log(`The adapter will now restart and re-authenticate! If not, please restart it manually.`, "warn");
								await updateConfig({
									identity: "",
									psk: "",
								});
								return;
							}
							case TradfriErrorCodes.ConnectionFailed: {
								_.log(`Could not connect to the gateway ${hostname}!`, "error");
								_.log(e.message, "error");
								return;
							}
						}
					} else {
						_.log(`Could not connect to the gateway ${hostname}!`, "error");
						_.log(e.message, "error");
						return;
					}
				}
			} else if (securityCode != null && securityCode.length > 0) {
				// use the security code to create an identity and psk
				try {
					({ identity, psk } = await $.tradfri.authenticate(securityCode));
					// store it and restart the adapter
					_.log(`The authentication was successful. The adapter should now restart. If not, please restart it manually.`, "info");
					await updateConfig({
						identity,
						psk,
					});
				} catch (e) {
					if (e instanceof TradfriError) {
						switch (e.code) {
							case TradfriErrorCodes.ConnectionTimedOut: {
								_.log(`The gateway ${hostname} is unreachable or did not respond in time!`, "error");
								_.log(`Please check your network and adapter settings and restart the adapter!`, "error");
							}
							case TradfriErrorCodes.AuthenticationFailed: {
								_.log(`The security code is incorrect or something else went wrong with the authentication.`, "error");
								_.log(`Please check your adapter settings and restart the adapter!`, "error");
								return;
							}
							case TradfriErrorCodes.ConnectionFailed: {
								_.log(`Could not authenticate with the gateway ${hostname}!`, "error");
								_.log(e.message, "error");
								return;
							}
						}
					} else {
						_.log(`Could not authenticate with the gateway ${hostname}!`, "error");
						_.log(e.message, "error");
						return;
					}
				}
			}

			// watch the connection
			await adapter.setStateAsync("info.connection", true, true);
			connectionAlive = true;
			$.tradfri
				.on("connection alive", () => {
					if (connectionAlive) return;
					_.log("Connection to gateway reestablished", "info");
					adapter.setState("info.connection", true, true);
					connectionAlive = true;
				})
				.on("connection lost", () => {
					if (!connectionAlive) return;
					_.log("Lost connection to gateway", "warn");
					adapter.setState("info.connection", false, true);
					connectionAlive = false;
				})
				;

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
				.on("error", tradfri_error)
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
					if (instanceId == undefined) return;

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

			if (!connectionAlive && state && !state.ack && id.startsWith(adapter.namespace)) {
				_.log("Not connected to the gateway. Cannot send changes!", "warn");
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
					let val: ioBroker.State["val"] | undefined = state.val;
					if (stateObj.common.type === "number") {
						// node-tradfri-client handles floating point numbers,
						// but we'll round to 2 digits for clarity (or the configured value)
						let roundToDigits = adapter.config.roundToDigits || 2;
						// don't round the transition duration!
						if (id.endsWith("transitionDuration")) roundToDigits = 2;
						val = roundTo(val as unknown as number, roundToDigits);
						if (stateObj.common.min != null) val = Math.max(stateObj.common.min, val);
						if (stateObj.common.max != null) val = Math.min(stateObj.common.max, val);
					}

					switch (rootObj.native.type) {
						case "group": {
							// read the instanceId and get a reference value
							if (!(rootObj.native.instanceId in $.groups)) {
								_.log(`The group with ID ${rootObj.native.instanceId} was not found!`, "warn");
								return;
							}
							const group = $.groups[rootObj.native.instanceId].group;
							// if the change was acknowledged, update the state later
							let wasAcked: boolean = false;

							if (id.endsWith(".state")) {
								wasAcked = !await group.toggle(val as unknown as boolean);
							} else if (id.endsWith(".brightness")) {
								wasAcked = !await group.setBrightness(
									val as unknown as number,
									await getTransitionDuration(group),
								);
							} else if (id.endsWith(".position")) {
								wasAcked = !await group.setPosition(val as unknown as number);
							} else if (id.endsWith(".activeScene")) {
								// turn on and activate a scene
								wasAcked = !await group.activateScene(val as unknown as number);
							} else if (id.endsWith(".color")) {
								// color change is only supported manually, so we operate
								// the virtual state of this group
								val = normalizeHexColor(val as unknown as string);
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
									colorTemperature: val as unknown as number,
									transitionTime: await getTransitionDuration(group),
								});
								wasAcked = true;
							} else if (/\.(hue|saturation)$/.test(id)) {
								// hue and saturation have to be set together
								const prefix = id.substr(0, id.lastIndexOf(".") + 1);
								// Try to read the hue and saturation states. If one of them doesn't exist,
								// we cannot issue a command
								const hueState = await _.adapter.getStateAsync(prefix + "hue");
								if (hueState == undefined) return;
								const saturationState = await _.adapter.getStateAsync(prefix + "saturation");
								if (saturationState == undefined) return;

								const hue = hueState.val as unknown as number;
								const saturation = saturationState.val as unknown as number;
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
							} else if (id.endsWith(".stopBlinds")) {
								// This is a button without feedback, so no need to setState afterwards
								await group.stopBlinds();
							}

							// ack the state if neccessary and return
							if (wasAcked) adapter.setStateAsync(id, state, true);
							return;
						}

						case "virtual group": {
							// find the virtual group instance
							if (!(rootObj.native.instanceId in $.virtualGroups)) {
								_.log(`The virtual group with ID ${rootObj.native.instanceId} was not found!`, "warn");
								return;
							}
							const vGroup = $.virtualGroups[rootObj.native.instanceId];

							let operation: LightOperation | BlindOperation | PlugOperation | undefined;
							let wasAcked: boolean = false;

							if (id.endsWith(".state")) {
								operation = {
									onOff: val as unknown as boolean,
								};
							} else if (id.endsWith(".brightness")) {
								operation = {
									dimmer: val as unknown as number,
									transitionTime: await getTransitionDuration(vGroup),
								};
							} else if (id.endsWith(".position")) {
								operation = {
									position: val as unknown as number,
								};
							} else if (id.endsWith(".color")) {
								val = normalizeHexColor(val as unknown as string);
								if (val != null) {
									state.val = val;
									operation = {
										color: val,
										transitionTime: await getTransitionDuration(vGroup),
									};
								}
							} else if (id.endsWith(".colorTemperature")) {
								operation = {
									colorTemperature: val as unknown as number,
									transitionTime: await getTransitionDuration(vGroup),
								};
							} else if (/\.(hue|saturation)$/.test(id)) {
								// hue and saturation have to be set together
								const prefix = id.substr(0, id.lastIndexOf(".") + 1);
								// Try to read the hue and saturation states. If one of them doesn't exist,
								// we cannot issue a command
								const hueState = await _.adapter.getStateAsync(prefix + "hue");
								if (hueState == undefined) return;
								const saturationState = await _.adapter.getStateAsync(prefix + "saturation");
								if (saturationState == undefined) return;

								const hue = hueState.val as unknown as number;
								const saturation = saturationState.val as unknown as number;

								operation = {
									hue,
									saturation,
									transitionTime: await getTransitionDuration(vGroup),
								};
							} else if (id.endsWith(".transitionDuration")) {
								// No operation here, since this is part of another one
								wasAcked = true;
							} else if (id.endsWith(".stopBlinds")) {
								// This is a button without feedback, so no need to setState afterwards
								await stopBlinds(vGroup);
							}

							// update all lightbulbs in this group
							if (operation != null) {
								operateVirtualGroup(vGroup, operation);
								wasAcked = true;
							}

							// and ack the state change
							if (wasAcked) adapter.setStateAsync(id, state, true);
							return;
						}

						default: { // accessory

							if (id.indexOf(".lightbulb.") > -1 || id.indexOf(".plug.") > -1 || id.indexOf(".blind.") > -1) {
								// read the instanceId and get a reference value
								if (!(rootObj.native.instanceId in $.devices)) {
									_.log(`The device with ID ${rootObj.native.instanceId} was not found!`, "warn");
									return;
								}
								const accessory = $.devices[rootObj.native.instanceId];
								const light: Light | undefined = accessory.lightList && accessory.lightList[0];
								const plug: Plug | undefined = accessory.plugList && accessory.plugList[0];
								const blind: Blind | undefined = accessory.blindList && accessory.blindList[0];
								const specificAccessory = light || plug || blind;
								if (specificAccessory == undefined) {
									_.log(`Cannot operate an accessory that is neither a lightbulb nor a plug nor a blind`, "warn");
									return;
								}

								// if the change was acknowledged, update the state later
								let wasAcked: boolean = false;

								// operate the lights depending on the set state
								// if no request was sent, we can ack the state immediately
								if (id.endsWith(".state")) {
									wasAcked = !await specificAccessory.toggle(val as unknown as boolean);
								} else if (id.endsWith(".brightness")) {
									if (light != undefined) {
										wasAcked = !await light.setBrightness(
											val as unknown as number,
											await getTransitionDuration(accessory),
										);
									} else if (plug != undefined) {
										wasAcked = !await plug.setBrightness(val as unknown as number);
									}
								} else if (id.endsWith(".position")) {
									if (blind != undefined) {
										wasAcked = !await blind.setPosition(val as unknown as number);
									}
								} else if (id.endsWith(".color")) {
									// we need to differentiate here, because some ppl
									// might already have "color" states for white spectrum bulbs
									// in the future, we create different states for white and RGB bulbs
									if (light.spectrum === "rgb") {
										val = normalizeHexColor(val as unknown as string);
										if (val != null) {
											state.val = val;
											wasAcked = !await light.setColor(
												val,
												await getTransitionDuration(accessory),
											);
										}
									} else if (light.spectrum === "white") {
										wasAcked = !await light.setColorTemperature(
											val as unknown as number,
											await getTransitionDuration(accessory),
										);
									}
								} else if (id.endsWith(".colorTemperature")) {
									wasAcked = !await light.setColorTemperature(
										val as unknown as number,
										await getTransitionDuration(accessory),
									);
								} else if (/\.(hue|saturation)$/.test(id)) {
									// hue and saturation have to be set together
									const prefix = id.substr(0, id.lastIndexOf(".") + 1);
									// Try to read the hue and saturation states. If one of them doesn't exist,
									// we cannot issue a command
									const hueState = await _.adapter.getStateAsync(prefix + "hue");
									if (hueState == undefined) return;
									const saturationState = await _.adapter.getStateAsync(prefix + "saturation");
									if (saturationState == undefined) return;

									const hue = hueState.val as unknown as number;
									const saturation = saturationState.val as unknown as number;
									wasAcked = !await $.tradfri.operateLight(accessory, {
										hue,
										saturation,
										transitionTime: await getTransitionDuration(accessory),
									});
								} else if (id.endsWith(".transitionDuration")) {
									// this is part of another operation, just ack the state
									wasAcked = true;
								} else if (id.endsWith("blind.stop")) {
									// This is a button without feedback, so no need to setState afterwards
									await blind.stop();
								}

								// ack the state if neccessary and return
								if (wasAcked) adapter.setStateAsync(id, state, true);
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
				// close the gateway connection
				$.tradfri.destroy();
				adapter.setState("info.connection", false, true);

				callback();
			} catch (e) {
				callback();
			}
		},
	}) as ExtendedAdapter;
}

async function updateConfig(newConfig: Partial<ioBroker.AdapterConfig>) {
	// Create the config object
	const config: ioBroker.AdapterConfig = {
		...adapter.config,
		...newConfig,
	};
	// Update the adapter object
	const adapterObj = (await adapter.getForeignObjectAsync(`system.adapter.${adapter.namespace}`))!;
	adapterObj.native = config as Record<string, any>;
	await adapter.setForeignObjectAsync(`system.adapter.${adapter.namespace}`, adapterObj);
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
		await adapter.deleteDeviceAsync(deviceName);
		delete $.devices[instanceId];
	}
}

async function tradfri_groupUpdated(group: Group) {
	// remember the group
	if (!(group.instanceId in $.groups)) {
		// if there's none, create one
		$.groups[group.instanceId] = {
			group: null!, // we'll assign this directly after the if branch
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
		await adapter.deleteChannelAsync(groupName);
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

function tradfri_error(error: Error) {
	if (error instanceof TradfriError) {
		if (
			error.code === TradfriErrorCodes.NetworkReset ||
			error.code === TradfriErrorCodes.ConnectionTimedOut
		) { return; } // it's okay, just swallow the error
	}
	_.log(error.toString(), "error");
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
			default:
				return 0; // other accessories have no transition duration
		}
	} else if (accessoryOrGroup instanceof Group || accessoryOrGroup instanceof VirtualGroup) {
		stateId = calcGroupId(accessoryOrGroup) + ".transitionDuration";
	} else return assertNever(accessoryOrGroup);

	const ret = await adapter.getStateAsync(stateId);
	if (ret != null) return ret.val as unknown as number;
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
			const deviceIDs: number[] = g.native.deviceIDs.map((d: string) => parseInt(d, 10));
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

function getMessage(err: Error | string): string {
	// Irgendwo gibt es wohl einen Fehler ohne Message
	if (err == null) return "undefined";
	if (typeof err === "string") return err;
	if (err.message != null) return err.message;
	if (err.name != null) return err.name;
	return err.toString();
}

function onUnhandledRejection(err: unknown) {
	let message = "unhandled promise rejection:" + getMessage(err as any);
	if (err instanceof Error && err.stack != null) message += "\n> stack: " + err.stack;
	(adapter && adapter.log || console).error(message);
	terminate(1, "unhandled promise rejection");
}

function onUnhandledError(err: Error) {
	let message = "unhandled exception:" + getMessage(err);
	if (err.stack != null) message += "\n> stack: " + err.stack;
	(adapter && adapter.log || console).error(message);
	terminate(1, "unhandled exception");
}

function terminate(exitCode?: number, reason?: string) {
	if (adapter && typeof adapter.terminate === "function") {
		adapter.terminate(reason);
	} else {
		process.exit(exitCode);
	}
}

// Trace unhandled errors
process.on("unhandledRejection", onUnhandledRejection);
process.on("uncaughtException", onUnhandledError);

// try loading tradfri module to catch potential errors
let tradfriClientLibLoaded = false;
try {
	// tslint:disable-next-line:no-var-requires
	require("node-tradfri-client");
	tradfriClientLibLoaded = true;
} catch (e) {
	console.error(`The module "node-aead-crypto" was not installed correctly!`);
	console.error(`To try reinstalling it, goto "${path.join(__dirname, "..")}" and run`);
	console.error(`npm install --production`);
	console.error(`If that fails due to missing access rights, run`);
	console.error(`${process.platform !== "win32" ? "sudo -H " : ""}npm install --production --unsafe-perm`);
	console.error(`instead. Afterwards, restart this adapter.`);
}

if (module.parent) {
	// Export startAdapter in compact mode
	if (tradfriClientLibLoaded) {
		module.exports = startAdapter;
	}
} else {
	// Otherwise start the adapter immediately
	if (tradfriClientLibLoaded) {
		startAdapter();
	} else {
		terminate(11, "Required library missing"); // Do not restart!
	}
}
