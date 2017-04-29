"use strict";
import IPSOObject from "./ipsoObject";
import IPSODevice from "./ipsoDevice";
import DeviceInfo from "./deviceInfo";

// 
export default class Group extends IPSODevice {

	constructor(source) {
		super.defineProperties(
			["5850", "onOff", false], // <bool>
			["5851", "dimmer", 0], // <int> [0..254]
			["9039", "sceneId", []], // <int> or [<int>]
			["9018", "deviceIDs", [], obj => parseAccessoryLink(obj)], // [<int>] (after parsing)
		)

		super(source);
	}
}

function parseAccessoryLink(link) {
	const hsLink = link["15002"];
	const deviceIDs = hsLink["9003"];
	return deviceIDs;
}