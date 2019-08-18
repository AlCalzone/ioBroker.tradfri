/// <reference types="iobroker" />
import { Accessory, Group } from "node-tradfri-client";
import { VirtualGroup } from "../lib/virtual-group";
export declare function extendVirtualGroup(group: VirtualGroup): void;
export declare function extendGroup(group: Group): void;
/**
 * Updates all group states that are equal for all its devices
 * @param changedAccessory If defined, only update the groups this is a part of.
 * @param changedStateId If defined, only update the corresponding states in the group.
 */
export declare function updateMultipleGroupStates(changedAccessory?: Accessory, changedStateId?: string): void;
export declare function updateGroupStates(group: Group | VirtualGroup, changedStateId?: string): void;
export declare function syncGroupsWithState(id: string, state: ioBroker.State | null | undefined): void;
