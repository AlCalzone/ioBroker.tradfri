import { Group } from "../ipso/group";
import { Global as _ } from "../lib/global";
import { DictionaryLike, dig, entries, filter } from "../lib/object-polyfill";
import { padStart } from "../lib/strings";
import { VirtualGroup } from "../lib/virtual-group";
import { gateway as gw } from "./gateway";

/**
 * Returns the common part of the ioBroker object representing the given group
 */
export function groupToCommon(group: Group | VirtualGroup): ioBroker.ObjectCommon {
	let name: string;
	if (group instanceof Group) {
		name = group.name;
	} else /* group instanceof VirtualGroup */ {
		if (typeof group.name === "string" && group.name.length > 0) {
			name = group.name;
		} else {
			name = `virtual group ${group.instanceId}`;
		}
	}
	return { name };
}

/**
 * Returns the native part of the ioBroker object representing the given group
 */
export function groupToNative(group: Group | VirtualGroup): DictionaryLike<any> {
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
	}
	const postfix: string = group.instanceId.toString();
	return `${prefix}-${padStart(postfix, 5, "0")}`;
}

/* creates or edits an existing <group>-object for a virtual group */
export function extendVirtualGroup(group: VirtualGroup) {
	const objId = calcGroupId(group);

	if (objId in gw.objects) {
		// check if we need to edit the existing object
		const grpObj = gw.objects[objId];
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
		if (changed) _.adapter.extendObject(objId, grpObj);

		// TODO: Update group states where applicable. See extendGroup for the code

	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "channel",
			common: groupToCommon(group),
			native: groupToNative(group),
		};
		_.adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		const stateObjs: DictionaryLike<ioBroker.Object> = {
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
			color: {
				_id: `${objId}.color`,
				type: "state",
				common: {
					name: "Color temperature",
					read: true, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 100,
					unit: "%",
					type: "number",
					role: "level.color.temperature",
					desc: "Color temperature of this group's lightbulbs. Range: 0% = cold, 100% = warm",
				},
				native: {
					path: "colorX",
				},
			},
		};

		const createObjects = Object.keys(stateObjs)
			.map((key) => {
				const obj = stateObjs[key];
				let initialValue = null;
				if (obj.native.path != null) {
					// Object could have a default value, find it
					initialValue = dig<any>(group, obj.native.path);
				}
				// create object and return the promise, so we can wait
				return _.adapter.$createOwnStateEx(obj._id, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}

/* creates or edits an existing <group>-object for a group */
export function extendGroup(group: Group) {
	const objId = calcGroupId(group);

	if (objId in gw.objects) {
		// check if we need to edit the existing object
		const grpObj = gw.objects[objId];
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
		if (changed) _.adapter.extendObject(objId, grpObj);

		// ====

		// from here we can update the states
		// filter out the ones belonging to this device with a property path
		const stateObjs = filter(
			gw.objects,
			obj => obj._id.startsWith(objId) && obj.native && obj.native.path,
		);
		// for each property try to update the value
		for (const [id, obj] of entries(stateObjs)) {
			try {
				// Object could have a default value, find it
				const newValue = dig<any>(group, obj.native.path);
				_.adapter.setState(id, newValue, true);
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
		_.adapter.setObject(objId, devObj);

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
			color: {
				_id: `${objId}.color`,
				type: "state",
				common: {
					name: "Color temperature",
					read: true, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 100,
					unit: "%",
					type: "number",
					role: "level.color.temperature",
					desc: "Color temperature of this group's lightbulbs. Range: 0% = cold, 100% = warm",
				},
				native: {
					// virtual state, so no real path to an object exists
					// we still have to give path a value, because other functions check for its existence
					path: "__virtual__",
				},
			},
		};

		const createObjects = Object.keys(stateObjs)
			.map((key) => {
				const obj = stateObjs[key];
				let initialValue = null;
				if (obj.native.path != null) {
					// Object could have a default value, find it
					initialValue = dig<any>(group, obj.native.path);
				}
				// create object and return the promise, so we can wait
				return _.adapter.$createOwnStateEx(obj._id, obj, initialValue);
			})
			;
		Promise.all(createObjects);

	}
}
