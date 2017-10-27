import { Accessory } from "../ipso/accessory";
import { Group, GroupOperation } from "../ipso/group";
import { LightOperation } from "../ipso/light";
import { VirtualGroup } from "../lib/virtual-group";
/**
 * Sets some properties on a lightbulb
 * @param accessory The parent accessory of the lightbulb
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export declare function operateLight(accessory: Accessory, operation: LightOperation): Promise<boolean>;
/**
 * Sets some properties on a group
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export declare function operateGroup(group: Group, operation: GroupOperation): Promise<boolean>;
/**
 * Sets some properties on virtual group or virtual properties on a real group.
 * Can be used to manually update non-existing endpoints on real groups.
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
export declare function operateVirtualGroup(group: Group | VirtualGroup, operation: LightOperation): Promise<void>;
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
