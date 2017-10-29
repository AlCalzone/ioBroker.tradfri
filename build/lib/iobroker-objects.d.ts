import { Accessory } from "../ipso/accessory";
import { Group } from "../ipso/group";
import { Scene } from "../ipso/scene";
import { GroupInfo } from "../modules/gateway";
import { DictionaryLike } from "./object-polyfill";
import { VirtualGroup } from "./virtual-group";
/**
 * Returns the common part of the ioBroker object representing the given accessory
 */
export declare function accessoryToCommon(accessory: Accessory): ioBroker.ObjectCommon;
/**
 * Returns the native part of the ioBroker object representing the given accessory
 */
export declare function accessoryToNative(accessory: Accessory): DictionaryLike<any>;
export declare function extendDevice(accessory: Accessory): void;
export declare function updatePossibleScenes(groupInfo: GroupInfo): Promise<void>;
export declare function getAccessoryIcon(accessory: Accessory): string;
/**
 * Returns the ioBroker id of the root object for the given state
 */
export declare function getRootId(stateId: string): string;
/**
 * Extracts the instance id from a given state or object id
 * @param id State or object id whose instance id should be extracted
 */
export declare function getInstanceId(id: string): number;
/**
 * Determines the object ID under which the given accessory should be stored
 */
export declare function calcObjId(accessory: Accessory): string;
/**
 * Determines the object name under which the given group accessory be stored,
 * excluding the adapter namespace
 */
export declare function calcObjName(accessory: Accessory): string;
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
/**
 * Determines the object ID under which the given scene should be stored
 */
export declare function calcSceneId(scene: Scene): string;
/**
 * Determines the object name under which the given scene should be stored,
 * excluding the adapter namespace
 */
export declare function calcSceneName(scene: Scene): string;
export declare type ioBrokerObjectDefinition = (rootId: string, rootType: "device" | "group" | "virtual group") => ioBroker.Object;
/**
 * Contains definitions for all kinds of states we're going to create
 */
export declare const objectDefinitions: DictionaryLike<ioBrokerObjectDefinition>;
