import { DeviceInfo } from "./deviceInfo";
import { IPSODevice } from "./ipsoDevice";
import { Light } from "./light";
export declare enum AccessoryTypes {
    remote = 0,
    lightbulb = 2,
}
export declare class Accessory extends IPSODevice {
    type: AccessoryTypes;
    deviceInfo: DeviceInfo;
    alive: boolean;
    lastSeen: number;
    lightList: Light[];
    plugList: IPSODevice[];
    sensorList: IPSODevice[];
    switchList: IPSODevice[];
    otaUpdateState: number;
}
