/**
 * Provides operations for Tradfri devices using the CoAP layer
 */

import { Accessory, AccessoryTypes, Group, LightOperation } from "node-tradfri-client";
import { VirtualGroup } from "../lib/virtual-group";
import { session as $ } from "./session";

/**
 * Sets some properties on virtual group or virtual properties on a real group.
 * Can be used to manually update non-existing endpoints on real groups.
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export async function operateVirtualGroup(group: Group | VirtualGroup, operation: LightOperation): Promise<void> {

	// find all lightbulbs belonging to this group
	const lightbulbAccessories = group.deviceIDs
		.map(id => $.devices[id])
		.filter(dev => dev != null && dev.type === AccessoryTypes.lightbulb)
		;

	for (const acc of lightbulbAccessories) {
		await $.tradfri.operateLight(acc, operation);
	}
	// and update the group
	if (group instanceof VirtualGroup) {
		group.merge(operation);
	}
}

/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 * @returns true if a request was sent, false otherwise
 */
export async function renameDevice(accessory: Accessory, newName: string): Promise<boolean> {
	// create a copy to modify
	const newAccessory = accessory.clone();
	newAccessory.name = newName;

	return $.tradfri.updateDevice(newAccessory);
}

/**
 * Renames a group
 * @param group The group to be renamed
 * @param newName The new name to be given to the group
 * @returns true if a request was sent, false otherwise
 */
export async function renameGroup(group: Group, newName: string): Promise<boolean> {
	// create a copy to modify
	const newGroup = group.clone();
	newGroup.name = newName;

	return $.tradfri.updateGroup(newGroup);
}
