import { IPSODevice } from "./ipsoDevice";
import { IPSOObject, ipsoKey, serializeWith, deserializeWith, PropertyTransform, required } from "./ipsoObject";

export class Group extends IPSODevice {

	@ipsoKey("5850")
	public onOff: boolean = false; // <bool>

	@ipsoKey("5851")
	public dimmer: number = 0; // <int> [0..254]

	@ipsoKey("9039")
	public sceneId: number | number[];

	@ipsoKey("9018")
	@deserializeWith(obj => parseAccessoryLink(obj))
	public deviceIDs: number[];

}

// TODO: Type annotation
function parseAccessoryLink(link): number[] {
	const hsLink = link["15002"];
	const deviceIDs = hsLink["9003"];
	return deviceIDs;
}
