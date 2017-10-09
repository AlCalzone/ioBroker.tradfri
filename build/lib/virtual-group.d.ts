import { LightOperation } from "../ipso/light";
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
    /**
     * Updates this virtual group's state with the changes contained in the given operation
     */
    merge(operation: LightOperation): void;
}
