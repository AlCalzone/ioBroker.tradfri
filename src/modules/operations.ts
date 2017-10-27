/**
 * Provides operations for Tradfri devices using the CoAP layer
 */

import { CoapClient as coap } from "node-coap-client";
import { Accessory, AccessoryTypes } from "../ipso/accessory";
import { endpoints as coapEndpoints} from "../ipso/endpoints";
import { Group, GroupOperation } from "../ipso/group";
import { LightOperation } from "../ipso/light";
import { Global as _ } from "../lib/global";
import { VirtualGroup } from "../lib/virtual-group";
import { gateway as gw } from "./gateway";

/**
 * Sets some properties on a lightbulb
 * @param accessory The parent accessory of the lightbulb
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export async function operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean> {
	if (accessory.type !== AccessoryTypes.lightbulb) {
		throw new Error("The parameter accessory must be a lightbulb!");
	}

	// the url to be requested
	const url: string = `${gw.requestBase}${coapEndpoints.devices}/${accessory.instanceId}`;

	// create a copy to modify
	const newAccessory = accessory.clone();
	// get the Light instance to modify
	const light = newAccessory.lightList[0];
	light.merge(operation);

	const serializedObj = newAccessory.serialize(accessory); // serialize with the old object as a reference

	// If the serialized object contains no properties, we don't need to send anything
	if (!serializedObj || Object.keys(serializedObj).length === 0) {
		_.log("stateChange > empty object, not sending any payload", "debug");
		return false; // signal that no request was made
	}

	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("stateChange > sending payload: " + payload, "debug");

	payload = Buffer.from(payload);
	await coap.request(url, "put", payload);

	return true;
}

/**
 * Sets some properties on a group
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export async function operateGroup(group: Group, operation: GroupOperation): Promise<boolean> {

	// the url to be requested
	const url: string = `${gw.requestBase}${coapEndpoints.groups}/${group.instanceId}`;

	// create a copy to modify
	const newGroup = group.clone();
	newGroup.merge(operation);

	const serializedObj = newGroup.serialize(group); // serialize with the old object as a reference

	// If the serialized object contains no properties, we don't need to send anything
	if (!serializedObj || Object.keys(serializedObj).length === 0) {
		_.log("stateChange > empty object, not sending any payload", "debug");
		return false; // signal that no request was made
	}

	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("stateChange > sending payload: " + payload, "debug");

	payload = Buffer.from(payload);
	await coap.request(url, "put", payload);

	return true;
}

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
		.map(did => gw.devices[did])
		.filter(dev => dev != null && dev.type === AccessoryTypes.lightbulb)
		;

	for (const acc of lightbulbAccessories) {
		await operateLight(acc, operation);
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

	// serialize with the old object as a reference
	const serializedObj = newAccessory.serialize(accessory);
	// If the serialized object contains no properties, we don't need to send anything
	if (!serializedObj || Object.keys(serializedObj).length === 0) {
		_.log("renameDevice > empty object, not sending any payload", "debug");
		return false;
	}

	// get the payload
	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("renameDevice > sending payload: " + payload, "debug");
	payload = Buffer.from(payload);

	await coap.request(
		`${gw.requestBase}${coapEndpoints.devices}/${accessory.instanceId}`, "put", payload,
	);
	return true;

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

	// serialize with the old object as a reference
	const serializedObj = newGroup.serialize(group);
	// If the serialized object contains no properties, we don't need to send anything
	if (!serializedObj || Object.keys(serializedObj).length === 0) {
		_.log("renameGroup > empty object, not sending any payload", "debug");
		return false;
	}

	// get the payload
	let payload: string | Buffer = JSON.stringify(serializedObj);
	_.log("renameDevice > sending payload: " + payload, "debug");
	payload = Buffer.from(payload);

	await coap.request(
		`${gw.requestBase}${coapEndpoints.groups}/${group.instanceId}`, "put", payload,
	);
	return true;

}
