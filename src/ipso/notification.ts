import IPSODevice from "./ipsoDevice";
import {IPSOObject, PropertyDefinition} from "./ipsoObject";

export default class Notification extends IPSODevice {

	constructor(sourceObj, ...properties: PropertyDefinition[]) {
		super(sourceObj, ...properties,
			["9015", "event", 0], // <int> -> notificationType
			["9017", "details", {}, arr => parseNotificationDetails(arr)], // -> <dictionary> (from "key=value"-Array)
			["9014", "state", 0], // => ?
		);
	}
}

function parseNotificationDetails(kvpList: string[]) {
	const ret = {};
	for (const kvp of kvpList) {
		const parts = kvp.split("=");
		ret[parts[0]] = parts[1];
	}
	return ret;
}
