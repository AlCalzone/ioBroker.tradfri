import { entries, filter, values } from "alcalzone-shared/objects";
import { Accessory, AccessoryTypes, Group } from "node-tradfri-client";
import { Global as _ } from "../lib/global";
import {
	calcGroupId,
	getInstanceId,
	groupToCommon,
	groupToNative,
	objectDefinitions
} from "../lib/iobroker-objects";
import { roundTo } from "../lib/math";
import { dig } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";
import { session as $ } from "./session";

/* creates or edits an existing <group>-object for a virtual group */
export function extendVirtualGroup(group: VirtualGroup) {
	const objId = calcGroupId(group);

	if (objId in $.objects) {
		// check if we need to edit the existing object
		const grpObj = $.objects[objId];
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
		if (changed) _.adapter.setObject(objId, grpObj);

		// TODO: Update group states where applicable. See extendGroup for the code
	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "channel",
			common: groupToCommon(group),
			native: groupToNative(group)
		};
		_.adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		// prettier-ignore
		const stateObjs: Record<string, ioBroker.Object> = {
			state: objectDefinitions.onOff(objId, "virtual group"),
			transitionDuration: objectDefinitions.transitionDuration(objId, "virtual group"),
			brightness: objectDefinitions.brightness(objId, "virtual group"),
			colorTemperature: objectDefinitions.colorTemperature(objId, "virtual group"),
			color: objectDefinitions.color(objId, "virtual group"),
			hue: objectDefinitions.hue(objId, "virtual group"),
			saturation: objectDefinitions.saturation(objId, "virtual group"),
			position: objectDefinitions.position(objId, "virtual group"),
			stopBlinds: objectDefinitions.stopBlinds(objId, "virtual group"),
		};

		const createObjects = Object.keys(stateObjs).map(key => {
			const obj = stateObjs[key];
			let initialValue = null;
			if (obj.native.path != null) {
				// Object could have a default value, find it
				initialValue = dig<any>(group, obj.native.path);
			}
			// create object and return the promise, so we can wait
			return _.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
		});
		Promise.all(createObjects);
	}
}

/* creates or edits an existing <group>-object for a group */
export function extendGroup(group: Group) {
	const objId = calcGroupId(group);

	if (objId in $.objects) {
		// check if we need to edit the existing object
		const grpObj = $.objects[objId];
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
		if (changed) _.adapter.setObject(objId, grpObj);

		// ====

		// from here we can update the states
		// filter out the ones belonging to this device with a property path
		const stateObjs = filter(
			$.objects,
			obj => obj._id.startsWith(objId) && obj.native && obj.native.path
		);
		// for each property try to update the value
		for (const [id, obj] of entries(stateObjs)) {
			try {
				// Object could have a default value, find it
				let newValue = dig(group, obj.native.path);
				const roundToDigits = _.adapter.config.roundToDigits;
				if (
					typeof roundToDigits === "number" &&
					typeof newValue === "number"
				) {
					newValue = roundTo(newValue, roundToDigits);
				}
				_.adapter.setState(id, newValue as any, true);
			} catch (e) {
				/* skip this value */
			}
		}
	} else {
		// create new object
		const devObj: ioBroker.Object = {
			_id: objId,
			type: "channel",
			common: groupToCommon(group),
			native: groupToNative(group)
		};
		_.adapter.setObject(objId, devObj);

		// also create state objects, depending on the accessory type
		// prettier-ignore
		const stateObjs: Record<string, ioBroker.Object> = {
			activeScene: objectDefinitions.activeScene(objId, "group"),
			state: objectDefinitions.onOff(objId, "group"),
			transitionDuration: objectDefinitions.transitionDuration(objId, "group"),
			brightness: objectDefinitions.brightness(objId, "group"),
			colorTemperature: objectDefinitions.colorTemperature(objId, "group"),
			color: objectDefinitions.color(objId, "group"),
			hue: objectDefinitions.hue(objId, "group"),
			saturation: objectDefinitions.saturation(objId, "group"),
			position: objectDefinitions.position(objId, "group"),
			stopBlinds: objectDefinitions.stopBlinds(objId, "group"),
		};

		const createObjects = Object.keys(stateObjs).map(key => {
			const obj = stateObjs[key];
			let initialValue = null;
			if (obj.native.path != null) {
				// Object could have a default value, find it
				initialValue = dig<any>(group, obj.native.path);
			}
			// create object and return the promise, so we can wait
			return _.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
		});
		Promise.all(createObjects);
	}
}

/** Returns the only value in the given array if they are all the same, otherwise null */
function getCommonValue<T>(arr: T[]): T | null {
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] !== arr[i - 1]) return null;
	}
	return arr[0];
}

const updateTimers: Record<string, NodeJS.Timer> = {};
function debounce(id: string, action: () => void, timeout: number) {
	// clear existing timeouts
	if (id in updateTimers) clearTimeout(updateTimers[id]);
	// set a new debounce timer
	updateTimers[id] = setTimeout(() => {
		delete updateTimers[id];
		action();
	}, timeout);
}

async function updateGroupState(
	id: string,
	value: string | number | boolean | ioBroker.State | null
): Promise<void> {
	const curState = await _.adapter.getStateAsync(id);
	if (curState != null && value == null) {
		await _.adapter.delStateAsync(id);
	} else if (curState !== value) {
		const roundToDigits = _.adapter.config.roundToDigits;
		if (typeof roundToDigits === "number" && typeof value === "number") {
			value = roundTo(value, roundToDigits);
		}
		await _.adapter.setStateAsync(id, value as any, true);
	}
}

/**
 * Updates all group states that are equal for all its devices
 * @param changedAccessory If defined, only update the groups this is a part of.
 * @param changedStateId If defined, only update the corresponding states in the group.
 */
export function updateMultipleGroupStates(
	changedAccessory?: Accessory,
	changedStateId?: string
) {
	const groupsToUpdate: (Group | VirtualGroup)[] = values($.groups)
		.map(g => g.group as Group | VirtualGroup)
		.concat(values($.virtualGroups))
		.filter(
			g =>
				changedAccessory == null ||
				(g.deviceIDs != undefined &&
					g.deviceIDs.indexOf(changedAccessory.instanceId) > -1)
		);
	for (const group of groupsToUpdate) {
		updateGroupStates(group, changedStateId);
	}
}

export function updateGroupStates(
	group: Group | VirtualGroup,
	changedStateId?: string
) {
	if (group.deviceIDs == null) return;
	const objId = calcGroupId(group);

	const groupBulbs = group.deviceIDs
		.map(id => $.devices[id])
		.filter(a => a != null && a.type === AccessoryTypes.lightbulb)
		.map(a => a.lightList[0]);
	const groupBlinds = group.deviceIDs
		.map(id => $.devices[id])
		.filter(a => a != null && a.type === AccessoryTypes.blind)
		.map(a => a.blindList[0]);
	const groupPlugs = group.deviceIDs
		.map(id => $.devices[id])
		.filter(a => a != null && a.type === AccessoryTypes.plug)
		.map(a => a.plugList[0]);

	// Seperate the bulbs into no spectrum/white spectrum/rgb bulbs
	const whiteSpectrumBulbs = groupBulbs.filter(b => b.spectrum === "white");
	const rgbBulbs = groupBulbs.filter(b => b.spectrum === "rgb");

	// we're debouncing the state changes, so group or scene updates don't result in
	// deleting and recreating states
	const debounceTimeout = 250;

	// Try to update the on/off state
	if (
		groupBulbs.length > 0 &&
		(changedStateId == null || changedStateId.endsWith("lightbulb.state"))
	) {
		const commonState = getCommonValue(groupBulbs.map(b => b.onOff));
		// TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
		group.onOff = commonState!;
		const stateId = `${objId}.state`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the brightness state
	if (
		groupBulbs.length > 0 &&
		(changedStateId == null ||
			changedStateId.endsWith("lightbulb.brightness"))
	) {
		const commonState = getCommonValue(groupBulbs.map(b => b.dimmer));
		// TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
		group.dimmer = commonState!;
		const stateId = `${objId}.brightness`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the colorTemperature state
	if (
		whiteSpectrumBulbs.length > 0 &&
		(changedStateId == null ||
			changedStateId.endsWith("lightbulb.colorTemperature"))
	) {
		const commonState =
			whiteSpectrumBulbs.length > 0
				? getCommonValue(
						whiteSpectrumBulbs.map(b => b.colorTemperature)
				  )
				: null;
		const stateId = `${objId}.colorTemperature`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the color state
	if (
		rgbBulbs.length > 0 &&
		(changedStateId == null || changedStateId.endsWith("lightbulb.color"))
	) {
		const commonState =
			rgbBulbs.length > 0
				? getCommonValue(rgbBulbs.map(b => b.color))
				: null;
		const stateId = `${objId}.color`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the hue state
	if (
		rgbBulbs.length > 0 &&
		(changedStateId == null || changedStateId.endsWith("lightbulb.hue"))
	) {
		const commonState =
			rgbBulbs.length > 0
				? getCommonValue(rgbBulbs.map(b => b.hue))
				: null;
		const stateId = `${objId}.hue`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the saturation state
	if (
		rgbBulbs.length > 0 &&
		(changedStateId == null ||
			changedStateId.endsWith("lightbulb.saturation"))
	) {
		const commonState =
			rgbBulbs.length > 0
				? getCommonValue(rgbBulbs.map(b => b.saturation))
				: null;
		const stateId = `${objId}.saturation`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the position state
	if (
		groupBlinds.length > 0 &&
		(changedStateId == null || changedStateId.endsWith("blind.position"))
	) {
		const commonState =
			groupBlinds.length > 0
				? getCommonValue(groupBlinds.map(b => b.position))
				: null;
		// TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
		group.position = commonState!;
		const stateId = `${objId}.position`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}
	// Try to update the plug on/off state
	if (
		groupPlugs.length > 0 &&
		(changedStateId == null || changedStateId.endsWith("plug.state"))
	) {
		const commonState = getCommonValue(groupPlugs.map(p => p.onOff));
		// TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
		group.onOff = commonState!;
		const stateId = `${objId}.state`;
		debounce(
			stateId,
			() => updateGroupState(stateId, commonState),
			debounceTimeout
		);
	}

}

// gets called when a lightbulb state gets updated
// we use this to sync group states because those are not advertised by the gateway
export function syncGroupsWithState(
	id: string,
	state: ioBroker.State | null | undefined
) {
	if (state && state.ack) {
		const instanceId = getInstanceId(id);
		if (instanceId == undefined) return;
		if (instanceId in $.devices && $.devices[instanceId] != null) {
			const accessory = $.devices[instanceId];
			updateMultipleGroupStates(accessory, id);
		}
	}
}
