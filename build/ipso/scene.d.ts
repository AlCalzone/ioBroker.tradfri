import { IPSODevice } from "./ipsoDevice";
import { LightSetting } from "./lightSetting";
export default class Scene extends IPSODevice {
    isActive: boolean;
    isPredefined: boolean;
    lightSettings: LightSetting[];
    sceneIndex: number;
    useCurrentLightSettings: boolean;
}
