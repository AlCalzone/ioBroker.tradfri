"use strict";
import IPSOObject from "./ipsoObject";
import IPSODevice from "./ipsoDevice";
import DeviceInfo from "./deviceInfo";

// 
export default class Scene extends IPSODevice {

	constructor(sourceObj, ...properties) {
		super(sourceObj, ...properties,
			["9058", "isActive", false], // <bool>
			["9068", "isPredefined", true], // <bool>
			["15013", "lightSettings", []], // [<LightSetting>]
			["9057", "sceneIndex", 0], // <int>
			["9070", "useCurrentLightSettings", false], // <bool>
		);
	}
}