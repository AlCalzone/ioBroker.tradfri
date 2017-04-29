"use strict";
import IPSOObject from "./ipsoObject";
import IPSODevice from "./ipsoDevice";
import DeviceInfo from "./deviceInfo";

// 
export default class Notification extends IPSODevice {

	constructor(sourceObj, ...properties) {
		super(sourceObj, ...properties,
			["9015", "event", int], // -> notificationType
			["9017", "details", {}, arr => parseNotificationDetails(arr)], // -> <dictionary> (from "key=value"-Array)
			["9014", "state", 0], // => ?
		);
	}
}

function parseNotificationDetails(kvpList) {
	const ret = {};
	for (kvp of kvpList) {
		const parts = kvp.split("=");
		ret[parts[0]] = parts[1];
	}
	return ret;
}