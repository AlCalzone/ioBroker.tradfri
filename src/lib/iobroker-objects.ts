import { assertNever } from "alcalzone-shared/helpers";
import { composeObject, entries, filter } from "alcalzone-shared/objects";
import { Accessory, AccessoryTypes, Group, GroupInfo, PowerSources, Scene, Spectrum } from "node-tradfri-client";
import { session as $ } from "../modules/session";
import { Global as _ } from "./global";
import { roundTo } from "./math";
import { dig } from "./object-polyfill";
import { padStart } from "./strings";
import { VirtualGroup } from "./virtual-group";

/**
 * Returns the common part of the ioBroker object representing the given accessory
 */
export function accessoryToCommon(accessory: Accessory): ioBroker.ObjectCommon {
	const ret: ioBroker.ObjectCommon = {
		name: accessory.name,
	};
	const icon = getAccessoryIcon(accessory);
	if (icon != null) ret.icon = "icons/" + icon;
	return ret;
}

/**
 * Returns the native part of the ioBroker object representing the given accessory
 */
export function accessoryToNative(accessory: Accessory): Record<string, any> {
	return {
		instanceId: accessory.instanceId,
		manufacturer: accessory.deviceInfo.manufacturer,
		firmwareVersion: accessory.deviceInfo.firmwareVersion,
		modelNumber: accessory.deviceInfo.modelNumber,
		type: AccessoryTypes[accessory.type],
		serialNumber: accessory.deviceInfo.serialNumber,
	};
}

/**
 * Creates or edits an existing <device>-object for an accessory.
 * @param accessory The accessory to update
 */
export function extendDevice(accessory: Accessory) {
	const objId = calcObjId(accessory);

	if (objId in $.objects) {
		// check if we need to edit the existing object
		const devObj = $.objects[objId];
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
		if (changed) _.adapter.extendObject(objId, devObj);

		// ====

		// from here we can update the states
		// filter out the ones belonging to this device with a property path
		const stateObjs = filter(
			$.objects,
			obj => obj._id.startsWith(objId) && obj.native && obj.native.path,
		);
		// for each property try to update the value
		for (const [id, obj] of entries(stateObjs)) {
			if (_.adapter.config.preserveTransitionTime && id.match(/\.transitionDuration$/g)) {
				// don't override the transition time
				continue;
			}
			try {
				// Object could have a default value, find it
				let newValue = dig<any>(accessory, obj.native.path);
				const roundToDigits = _.adapter.config.roundToDigits;
				if (typeof roundToDigits === "number" && typeof newValue === "number") {
					newValue = roundTo(newValue, roundToDigits);
				}
				_.adapter.setState(id, newValue as any, true);
			} catch (e) { /* skip this value */ }
		}

	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "device",
			common: accessoryToCommon(accessory),
			native: accessoryToNative(accessory),
		};
		_.adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		const stateObjs: Record<string, ioBroker.Object> = {
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

		if (
			accessory.type === AccessoryTypes.lightbulb
			|| accessory.type === AccessoryTypes.plug
		) {
			let channelName: string;
			let channelID: string;
			if (accessory.type === AccessoryTypes.lightbulb) {
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
				channelID = "lightbulb";
				stateObjs[channelID] = {
					_id: `${objId}.${channelID}`,
					type: "channel",
					common: {
						name: channelName!,
						role: "light",
					},
					native: {
						spectrum: spectrum, // remember the spectrum, so we can update different properties later
					},
				};
				if (spectrum === "white") {
					stateObjs[`${channelID}.colorTemperature`] = objectDefinitions.colorTemperature(objId, "device");
				} else if (spectrum === "rgb") {
					stateObjs[`${channelID}.color`] = objectDefinitions.color(objId, "device");
					stateObjs[`${channelID}.hue`] = objectDefinitions.hue(objId, "device");
					stateObjs[`${channelID}.saturation`] = objectDefinitions.saturation(objId, "device");
				}
				stateObjs[`${channelID}.transitionDuration`] = objectDefinitions.transitionDuration(objId, "device", accessory.type);

			} else /* if (accessory.type === AccessoryTypes.plug) */ {
				// obj.plug should be a channel
				channelID = "plug";
				stateObjs[channelID] = {
					_id: `${objId}.${channelID}`,
					type: "channel",
					common: {
						name: channelName!,
						role: "switch",
					},
					native: {},
				};
			}
			// Common properties for both plugs and lights
			// We keep brightness for now, so groups of plugs and lights can use dimmer commands
			stateObjs[`${channelID}.brightness`] = objectDefinitions.brightness(objId, "device", accessory.type);
			stateObjs[`${channelID}.state`] = objectDefinitions.onOff(objId, "device", accessory.type);
		}

		if (
			accessory.deviceInfo.power === PowerSources.Battery
			|| accessory.deviceInfo.power === PowerSources.InternalBattery
			|| accessory.deviceInfo.power === PowerSources.ExternalBattery
		) {
			stateObjs.battery = objectDefinitions.batteryPercentage(objId, "device");
		}

		const createObjects = Object.keys(stateObjs)
			.map((key) => {
				const obj = stateObjs[key];
				let initialValue = null;
				if (obj.native.path != null) {
					// Object could have a default value, find it
					initialValue = dig<any>(accessory, obj.native.path);
				}
				// create object and return the promise, so we can wait
				return _.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}

/**
 * Updates the possible scenes for a group
 * @param groupInfo The group to update
 */
export async function updatePossibleScenes(groupInfo: GroupInfo): Promise<void> {
	const group = groupInfo.group;
	// if this group is not in the dictionary, don't do anything
	if (!(group.instanceId in $.groups)) return;
	// find out which is the root object id
	const objId = calcGroupId(group);
	// scenes are stored under <objId>.activeScene
	const scenesId = `${objId}.activeScene`;

	// only extend that object if it exists already
	if (scenesId in $.objects) {
		// map scene ids and names to the dropdown
		const scenes = groupInfo.scenes;
		const newDropdownStates = composeObject(
			Object.keys(scenes).map(id => [id, scenes[id].name] as [string, string]),
		);
		// compare with the old dropdown states
		const obj = await _.adapter.getObjectAsync(scenesId) as ioBroker.StateObject;
		const oldDropdownStates = obj.common.states;
		if (JSON.stringify(newDropdownStates) !== JSON.stringify(oldDropdownStates)) {
			// and only log and update if something changed
			_.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);
			obj.common.states = newDropdownStates;
			await _.adapter.setObjectAsync(scenesId, obj);
		}
	}
}

export function getAccessoryIcon(accessory: Accessory): string | undefined {
	const model = accessory.deviceInfo.modelNumber;
	switch (model) {
		case "TRADFRI remote control":
			return "remote.png";
		case "TRADFRI motion sensor":
			return "motion_sensor.png";
		case "TRADFRI wireless dimmer":
			return "remote_dimmer.png";
		case "TRADFRI plug":
			return "plug.png";
	}
	if (accessory.type === AccessoryTypes.lightbulb) {
		let prefix: string;
		if (model.indexOf(" panel ") > -1) {
			prefix = "panel";
		} else if (model.indexOf(" door ") > -1) {
			prefix = "door";
		} else if (model.indexOf(" GU10 ") > -1) {
			prefix = "gu10";
		} else {
			prefix = "bulb";
		}
		let suffix: string = "";
		const spectrum = accessory.lightList[0].spectrum;
		if (spectrum === "white") {
			suffix = "_ws";
		} else if (spectrum === "rgb") {
			suffix = "_rgb";
		}
		return prefix + suffix + ".png";
	}
}

/**
 * Returns the ioBroker id of the root object for the given state
 */
export function getRootId(stateId: string) {
	const match = /^tradfri\.\d+\.\w+\-\d+/.exec(stateId);
	if (match) return match[0];
}
/**
 * Extracts the instance id from a given state or object id
 * @param id State or object id whose instance id should be extracted
 */
export function getInstanceId(id: string): number | undefined {
	const match = /^tradfri\.\d+\.\w+\-(\d+)/.exec(id);
	if (match) return +match[1];
}

/**
 * Determines the object ID under which the given accessory should be stored
 */
export function calcObjId(accessory: Accessory): string {
	return `${_.adapter.namespace}.${calcObjName(accessory)}`;
}
/**
 * Determines the object name under which the given group accessory be stored,
 * excluding the adapter namespace
 */
export function calcObjName(accessory: Accessory): string {
	let prefix: string;
	switch (accessory.type) {
		case AccessoryTypes.remote:
			prefix = "RC";
			break;
		case AccessoryTypes.lightbulb:
			prefix = "L";
			break;
		case AccessoryTypes.plug:
			prefix = "P";
			break;
		default:
			_.log(`Unknown accessory type ${accessory.type}. Please send this info to the developer with a short description of the device!`, "warn");
			prefix = "XYZ";
			break;
	}
	return `${prefix}-${accessory.instanceId}`;
}

/**
 * Returns the common part of the ioBroker object representing the given group
 */
export function groupToCommon(group: Group | VirtualGroup): ioBroker.ObjectCommon {
	let name: string;
	if (group instanceof Group) {
		name = group.name;
	} else if (group instanceof VirtualGroup) {
		if (typeof group.name === "string" && group.name.length > 0) {
			name = group.name;
		} else {
			name = `virtual group ${group.instanceId}`;
		}
	} else return assertNever(group);
	return { name };
}

/**
 * Returns the native part of the ioBroker object representing the given group
 */
export function groupToNative(group: Group | VirtualGroup): Record<string, any> {
	return {
		instanceId: group.instanceId,
		deviceIDs: group.deviceIDs,
		type: (group instanceof VirtualGroup ? "virtual " : "") + "group",
	};
}

/**
 * Determines the object ID under which the given group should be stored
 */
export function calcGroupId(group: Group | VirtualGroup): string {
	return `${_.adapter.namespace}.${calcGroupName(group)}`;
}
/**
 * Determines the object name under which the given group should be stored,
 * excluding the adapter namespace
 */
export function calcGroupName(group: Group | VirtualGroup): string {
	let prefix: string;
	if (group instanceof Group) {
		prefix = "G";
	} else if (group instanceof VirtualGroup) {
		prefix = "VG";
	} else return assertNever(group);
	const postfix: string = group.instanceId.toString();
	return `${prefix}-${padStart(postfix, 5, "0")}`;
}

/**
 * Determines the object ID under which the given scene should be stored
 */
export function calcSceneId(scene: Scene): string {
	return `${_.adapter.namespace}.${calcSceneName(scene)}`;
}
/**
 * Determines the object name under which the given scene should be stored,
 * excluding the adapter namespace
 */
export function calcSceneName(scene: Scene): string {
	return `S-${scene.instanceId}`;
}

export type ioBrokerObjectDefinition = (
	rootId: string,
	rootType: "device" | "group" | "virtual group",
	deviceType?: AccessoryTypes | undefined,
) => ioBroker.Object;

/** Returns a string representation of a member of the `AccessoryTypes` enum */
function accessoryTypeToString(type: AccessoryTypes) {
	return AccessoryTypes[type];
}

function getCoapAccessoryPropertyPathPrefix(deviceType: AccessoryTypes | undefined) {
	switch (deviceType) {
		case AccessoryTypes.lightbulb: return "lightList.[0].";
		case AccessoryTypes.plug: return "plugList.[0].";
		default: return "";
	}
}

/**
 * Contains definitions for all kinds of states we're going to create
 */
export const objectDefinitions: Record<string, ioBrokerObjectDefinition> = {
	activeScene: (rootId, _rootType, _deviceType) => ({
		_id: `${rootId}.activeScene`,
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
	}),

	// Lights and plugs
	onOff: (rootId, rootType, deviceType) => ({
		_id: rootType === "device" ? `${rootId}.${accessoryTypeToString(deviceType!)}.state` : `${rootId}.state`,
		type: "state",
		common: {
			name: "on/off",
			read: true,
			write: true,
			type: "boolean",
			role: "switch",
		},
		native: {
			path: getCoapAccessoryPropertyPathPrefix(deviceType) + "onOff",
		},
	}),

	// Lights and plugs for compatibility reasons
	// Anything > 0% should be "on"
	brightness: (rootId, rootType, deviceType) => {
		const deviceName = rootType === "device" ? accessoryTypeToString(deviceType!) : undefined;
		return {
			_id: rootType === "device" ? `${rootId}.${deviceName}.brightness` : `${rootId}.brightness`,
			type: "state",
			common: {
				name: "Brightness",
				read: true,
				write: true,
				min: 0,
				max: 100,
				unit: "%",
				type: "number",
				role: "level.dimmer",
				desc: rootType === "device" ?
					`Brightness of the ${deviceName}` :
					`Brightness of this group's ${deviceName}s`,
			},
			native: {
				path: getCoapAccessoryPropertyPathPrefix(deviceType) + "dimmer",
			},
		};
	},

	// Lights only?
	transitionDuration: (rootId, rootType, deviceType) => ({
		_id: rootType === "device" ? `${rootId}.lightbulb.transitionDuration` : `${rootId}.transitionDuration`,
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
			desc: rootType === "device" ?
				"Duration of a state change" :
				`Duration for state changes of this group's lightbulbs`,
			unit: "s",
		},
		native: {
			path: getCoapAccessoryPropertyPathPrefix(deviceType) + "transitionTime",
		},
	}),

	// Lights only
	colorTemperature: (rootId, rootType) => {
		const ret: ioBroker.Object = {
			_id: rootType === "device" ? `${rootId}.lightbulb.colorTemperature` : `${rootId}.colorTemperature`,
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
				desc: rootType === "device" ?
					"Range: 0% = cold, 100% = warm" :
					"Color temperature of this group's white spectrum lightbulbs. Range: 0% = cold, 100% = warm",
			},
			native: {},
		};
		if (rootType === "device") {
			ret.native.path = "lightList.[0].colorTemperature";
		} else if (rootType === "group") {
			// virtual state, so no real path to an object exists
			// we still have to give path a value, because other functions check for its existence
			ret.native.path = "__virtual__";
		} else if (rootType === "virtual group") {
			ret.native.path = "colorTemperature";
		}
		return ret;
	},

	// Lights only
	color: (rootId, rootType) => {
		const ret: ioBroker.Object = {
			_id: rootType === "device" ? `${rootId}.lightbulb.color` : `${rootId}.color`,
			type: "state",
			common: {
				name: "RGB color",
				read: true,
				write: true,
				type: "string",
				role: "level.color",
				desc: rootType === "device" ?
					"6-digit RGB hex string" :
					"Color of this group's RGB lightbulbs as a 6-digit hex string.",
			},
			native: {},
		};
		if (rootType === "device") {
			ret.native.path = "lightList.[0].color";
		} else if (rootType === "group") {
			// virtual state, so no real path to an object exists
			// we still have to give path a value, because other functions check for its existence
			ret.native.path = "__virtual__";
		} else if (rootType === "virtual group") {
			ret.native.path = "color";
		}
		return ret;
	},

	// Lights only
	hue: (rootId, rootType) => {
		const ret: ioBroker.Object = {
			_id: rootType === "device" ? `${rootId}.lightbulb.hue` : `${rootId}.hue`,
			type: "state",
			common: {
				name: "Hue",
				read: true,
				write: true,
				min: 0,
				max: 360,
				unit: "°",
				type: "number",
				role: "level.color.hue",
				desc: rootType === "device" ?
					"Hue of this RGB lightbulb" :
					"Hue of this group's RGB lightbulbs",
			},
			native: {},
		};
		if (rootType === "device") {
			ret.native.path = "lightList.[0].hue";
		} else if (rootType === "group") {
			// virtual state, so no real path to an object exists
			// we still have to give path a value, because other functions check for its existence
			ret.native.path = "__virtual__";
		} else if (rootType === "virtual group") {
			ret.native.path = "hue";
		}
		return ret;
	},

	// Lights only
	saturation: (rootId, rootType) => {
		const ret: ioBroker.Object = {
			_id: rootType === "device" ? `${rootId}.lightbulb.saturation` : `${rootId}.saturation`,
			type: "state",
			common: {
				name: "Saturation",
				read: true,
				write: true,
				min: 0,
				max: 100,
				unit: "%",
				type: "number",
				role: "level.color.saturation",
				desc: rootType === "device" ?
					"Saturation of this RGB lightbulb" :
					"Saturation of this group's RGB lightbulbs",
			},
			native: {},
		};
		if (rootType === "device") {
			ret.native.path = "lightList.[0].saturation";
		} else if (rootType === "group") {
			// virtual state, so no real path to an object exists
			// we still have to give path a value, because other functions check for its existence
			ret.native.path = "__virtual__";
		} else if (rootType === "virtual group") {
			ret.native.path = "saturation";
		}
		return ret;
	},

	batteryPercentage: (rootId) => ({
		_id: `${rootId}.batteryPercentage`,
		type: "state",
		common: {
			name: "Battery percentage",
			read: true,
			write: false,
			type: "number",
			min: 0,
			max: 100,
			def: 100,
			role: "indicator.maintenance",
			unit: "%",
		},
		native: {
			path: "deviceInfo.battery",
		},
	}),

};
