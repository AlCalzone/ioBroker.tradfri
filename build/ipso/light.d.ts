import { IPSODevice } from "./ipsoDevice";
export declare class Light extends IPSODevice {
    color: string;
    hue: number;
    saturation: number;
    colorX: number;
    colorY: number;
    colorTemperature: number;
    transitionTime: number;
    cumulativeActivePower: number;
    dimmer: number;
    onOff: boolean;
    onTime: number;
    powerFactor: number;
    unit: string;
}
