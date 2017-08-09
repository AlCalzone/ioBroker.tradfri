import {IPSOObject, PropertyDefinition} from "./ipsoObject";

// common base class for all devices
export default class IPSODevice extends IPSOObject {

	constructor(sourceObj, ...properties: PropertyDefinition[]) {
		super(sourceObj, ...properties,
			["9001", "name", ""],
			["9002", "createdAt", 0], // <long>
			["9003", "instanceId", ""], // <int>
		);
	}

}
