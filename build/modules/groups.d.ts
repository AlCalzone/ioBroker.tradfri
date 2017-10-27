import { Group } from "../ipso/group";
import { DictionaryLike } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";
/**
 * Returns the common part of the ioBroker object representing the given group
 */
export declare function groupToCommon(group: Group | VirtualGroup): ioBroker.ObjectCommon;
/**
 * Returns the native part of the ioBroker object representing the given group
 */
export declare function groupToNative(group: Group | VirtualGroup): DictionaryLike<any>;
/**
 * Determines the object ID under which the given group should be stored
 */
export declare function calcGroupId(group: Group | VirtualGroup): string;
/**
 * Determines the object name under which the given group should be stored,
 * excluding the adapter namespace
 */
export declare function calcGroupName(group: Group | VirtualGroup): string;
export declare function extendVirtualGroup(group: VirtualGroup): void;
export declare function extendGroup(group: Group): void;
