import IPSODevice from "./ipsoDevice";
import {IPSOObject, PropertyDefinition} from "./ipsoObject";

export default class Scene extends IPSODevice {

	constructor(sourceObj, ...properties: PropertyDefinition[]) {
		super(sourceObj, ...properties,
			["9058", "isActive", false], // <bool>
			["9068", "isPredefined", true], // <bool>
			["15013", "lightSettings", []], // [<LightSetting>]
			["9057", "sceneIndex", 0], // <int>
			["9070", "useCurrentLightSettings", false], // <bool>
		);
	}
}
