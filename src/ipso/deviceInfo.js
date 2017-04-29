"use strict";
import IPSOObject from "./ipsoObject";

// contains information about a specific device
export default class DeviceInfo extends IPSOObject {

	constructor(source) {
		super.defineProperties(
			["9", "battery", 0], // <int>
			["3", "firmwareVersion", ""], // <string>
			["0", "manufacturer", ""], // <string>
			["1", "modelNumber", ""], // <string>
			["6", "power", 0], // <int>
			["2", "serialNumber", ""] // <string>
		)

		super(source);
	}

}