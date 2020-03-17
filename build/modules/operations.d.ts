/**
 * Provides operations for Tradfri devices using the CoAP layer
 */
import { Accessory, Group, LightOperation, BlindOperation, PlugOperation } from "node-tradfri-client";
import { VirtualGroup } from "../lib/virtual-group";
/**
 * Sets some properties on virtual group or virtual properties on a real group.
 * Can be used to manually update non-existing endpoints on real groups.
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export declare function operateVirtualGroup(group: Group | VirtualGroup, operation: LightOperation | BlindOperation | PlugOperation): Promise<void>;
/**
 * Stops all blinds in a virtual group
 * @param group The virtual group which contains the blinds to be stopped
 */
export declare function stopBlinds(group: VirtualGroup): Promise<void>;
/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 * @returns true if a request was sent, false otherwise
 */
export declare function renameDevice(accessory: Accessory, newName: string): Promise<boolean>;
/**
 * Renames a group
 * @param group The group to be renamed
 * @param newName The new name to be given to the group
 * @returns true if a request was sent, false otherwise
 */
export declare function renameGroup(group: Group, newName: string): Promise<boolean>;
