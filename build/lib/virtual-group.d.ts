import { LightOperation } from "../ipso/light";
export declare class VirtualGroup {
    readonly instanceId: number;
    constructor(instanceId: number);
    name: string;
    onOff: boolean;
    dimmer: number;
    colorTemperature: number;
    transitionTime: number;
    color: string;
    hue: number;
    saturation: number;
    /**
     * The instance ids of all devices combined in this group
     */
    deviceIDs: number[];
    /**
     * Updates this virtual group's state with the changes contained in the given operation
     */
    merge(operation: LightOperation): void;
}
