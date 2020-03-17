/**
 * Provides operations for Tradfri devices using the CoAP layer
 */

import {
	Accessory,
	AccessoryTypes,
	Group,
	LightOperation,
	BlindOperation,
	PlugOperation
} from "node-tradfri-client";
import { VirtualGroup } from "../lib/virtual-group";
import { session as $ } from "./session";

/**
 * Sets some properties on virtual group or virtual properties on a real group.
 * Can be used to manually update non-existing endpoints on real groups.
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export async function operateVirtualGroup(
	group: Group | VirtualGroup,
	operation: LightOperation | BlindOperation | PlugOperation
): Promise<void> {
	if (group.deviceIDs == undefined) return;
	// Test which kind of operation this is
	if ("position" in operation) {
		// This is a blind operation
		// find all blinds belonging to this group
		const blindAccessories = group.deviceIDs
			.map(id => $.devices[id])
			.filter(dev => dev != null && dev.type === AccessoryTypes.blind);

		for (const acc of blindAccessories) {
			await $.tradfri.operateBlind(acc, operation);
		}
	} else {
		// This is a light or plug operation
		// find all lightbulbs belonging to this group
		const lightbulbAccessories = group.deviceIDs
			.map(id => $.devices[id])
			.filter(
				dev => dev != null && dev.type === AccessoryTypes.lightbulb
			);
		const plugAccessories = group.deviceIDs
			.map(id => $.devices[id])
			.filter(dev => dev != null && dev.type === AccessoryTypes.plug);

		if ("onOff" in operation || "dimmer" in operation) {
			// This operation is compatible with plugs
			for (const acc of plugAccessories) {
				await $.tradfri.operatePlug(acc, operation as PlugOperation);
			}
		}

		for (const acc of lightbulbAccessories) {
			await $.tradfri.operateLight(acc, operation as LightOperation);
		}
	}
	// and update the group
	if (group instanceof VirtualGroup) {
		group.merge(operation);
	}
}

/**
 * Stops all blinds in a virtual group
 * @param group The virtual group which contains the blinds to be stopped
 */
export async function stopBlinds(group: VirtualGroup): Promise<void> {
	if (group.deviceIDs == undefined) return;

	const blindAccessories = group.deviceIDs
		.map(id => $.devices[id])
		.filter(dev => dev != null && dev.type === AccessoryTypes.blind);
	for (const acc of blindAccessories) {
		await acc.blindList[0].stop();
	}
}

/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 * @returns true if a request was sent, false otherwise
 */
export function renameDevice(
	accessory: Accessory,
	newName: string
): Promise<boolean> {
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
export function renameGroup(group: Group, newName: string): Promise<boolean> {
	// create a copy to modify
	const newGroup = group.clone();
	newGroup.name = newName;

	return $.tradfri.updateGroup(newGroup);
}
