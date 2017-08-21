import IPSODevice from "./ipsoDevice";
import {IPSOObject, PropertyDefinition} from "./ipsoObject";

export default class Group extends IPSODevice {

	constructor(sourceObj, ...properties: PropertyDefinition[]) {
		super(sourceObj, ...properties,
			["5850", "onOff", false], // <bool>
			["5851", "dimmer", 0], // <int> [0..254]
			["9039", "sceneId", []], // <int> or [<int>]
			["9018", "deviceIDs", [], obj => parseAccessoryLink(obj)], // [<int>] (after parsing)
		);
	}
}

function parseAccessoryLink(link) {
	const hsLink = link["15002"];
	const deviceIDs = hsLink["9003"];
	return deviceIDs;
}
