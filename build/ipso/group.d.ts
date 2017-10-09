import { IPSODevice } from "./ipsoDevice";
export declare class Group extends IPSODevice {
    onOff: boolean;
    dimmer: number;
    sceneId: number;
    deviceIDs: number[];
    transitionTime: number;
}
