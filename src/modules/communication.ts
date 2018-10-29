import { Spectrum } from "node-tradfri-client";

export interface Group {
	id: string;
	name: string;
	deviceIDs: number[];
	type: "real" | "virtual";
}

export interface DeviceBase {
	id: string;
	name: string;
}
export interface LightbulbDevice extends DeviceBase {
	type: "lightbulb";
	spectrum?: Spectrum;
}

export interface PlugDevice extends DeviceBase {
	type: "plug";
}

export type Device = LightbulbDevice | PlugDevice;
