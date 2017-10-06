import { IPSODevice } from "./ipsoDevice";
import { Accessory } from "./accessory";
export declare class Light extends IPSODevice {
    private _accessory;
    constructor(_accessory?: Accessory);
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
    /**
     * Returns true if the current lightbulb is dimmable
     */
    isDimmable(): boolean;
    /**
     * Returns true if the current lightbulb is switchable
     */
    isSwitchable(): boolean;
    clone(): this;
    /**
     * Returns the supported color spectrum of the lightbulb
     */
    private _spectrum;
    getSpectrum(): Spectrum;
}
export declare type Spectrum = "none" | "white" | "rgb";
