"use strict";
import IPSOObject from "./ipsoObject";
import IPSODevice from "./ipsoDevice";
import DeviceInfo from "./deviceInfo";

// 
export default class Light extends IPSODevice {

	constructor(source) {
		super.defineProperties(
			["5706", "color", "f1e0b5"], // hex string
			["5709", "colorX", 0], // int
			["5710", "colorY", 0], // int
			["5805", "cumulativeActivePower", 0.0], // <float>
			["5851", "dimmer", 0], // <int> [0..254]
			["5850", "onOff", false], // <bool>
			["5852", "onTime", ""], // <int>
			["5820", "powerFactor", 0.0], // <float>
			["5712", "transitionTime", 5], // <int>
			["5701", "unit", ""],
		)

		super(source);
	}
}