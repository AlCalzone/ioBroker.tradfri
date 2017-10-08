import { Accessory } from "../ipso/accessory";
import { DictionaryLike } from "./object-polyfill";
export declare class VirtualGroup {
    readonly instanceId: number;
    constructor(instanceId: number);
    onOff: boolean;
    dimmer: number;
    colorX: number;
    transitionTime: number;
    /**
     * The instance ids of all devices combined in this group
     */
    deviceIDs: number[];
    serialize(references: DictionaryLike<Accessory>): DictionaryLike<any>;
}
