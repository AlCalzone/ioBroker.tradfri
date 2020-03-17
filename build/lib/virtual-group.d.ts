import { LightOperation, BlindOperation, PlugOperation } from "node-tradfri-client";
export declare class VirtualGroup {
    readonly instanceId: number;
    constructor(instanceId: number);
    name: string | undefined;
    onOff: boolean | undefined;
    dimmer: number | undefined;
    position: number | undefined;
    colorTemperature: number | undefined;
    transitionTime: number | undefined;
    color: string | undefined;
    hue: number | undefined;
    saturation: number | undefined;
    /**
     * The instance ids of all devices combined in this group
     */
    deviceIDs: number[] | undefined;
    /**
     * Updates this virtual group's state with the changes contained in the given operation
     */
    merge(operation: LightOperation | BlindOperation | PlugOperation): void;
}
