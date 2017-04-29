"use strict";
import IPSOObject from "./ipsoObject";

// common base class for all devices
export default class IPSODevice extends IPSOObject {

	constructor(sourceObj, ...properties) {
		super(sourceObj, ...properties,
			["9001", "name", ""],
			["9002", "createdAt", 0], // <long>
			["9003", "instanceId", ""] // <int>
		);
	}

}