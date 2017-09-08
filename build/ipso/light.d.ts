import { IPSODevice } from "./ipsoDevice";
export declare class Light extends IPSODevice {
    color: string;
    UNKNOWN1: number;
    UNKNOWN2: number;
    colorX: number;
    colorY: number;
    UNKNOWN3: number;
    transitionTime: number;
    cumulativeActivePower: number;
    dimmer: number;
    onOff: boolean;
    onTime: number;
    powerFactor: number;
    unit: string;
}
