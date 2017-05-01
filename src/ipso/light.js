"use strict";
//import IPSOObject from "./ipsoObject";
import IPSODevice from "./ipsoDevice";
//import DeviceInfo from "./deviceInfo";

// 
export default class Light extends IPSODevice {

	constructor(sourceObj, ...properties) {
		super(sourceObj, ...properties,
			["5706", "color", "f1e0b5"], // hex string
			["5707", "UNKNOWN1", 0], // ???
			["5708", "UNKNOWN2", 0], // ???
			["5709", "colorX", 0], // int
			["5710", "colorY", 0], // int
			["5711", "UNKNOWN3", 0], // ???
			["5712", "transitionTime", 5], // <int>
			["5805", "cumulativeActivePower", 0.0], // <float>
			["5851", "dimmer", 0], // <int> [0..254]
			["5850", "onOff", false], // <bool>
			["5852", "onTime", ""], // <int>
			["5820", "powerFactor", 0.0], // <float>
			["5701", "unit", ""],
		);
	}
}