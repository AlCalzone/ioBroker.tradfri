import { deserializers, serializers } from "../modules/conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

export class Group extends IPSODevice {

	@ipsoKey("5850")
	public onOff: boolean = false; // <bool>

	@ipsoKey("5851")
	public dimmer: number = 0; // <int> [0..254]

	@ipsoKey("9039")
	public sceneId: number;

	@ipsoKey("9018")
	@deserializeWith(obj => parseAccessoryLink(obj))
	@serializeWith(ids => toAccessoryLink(ids), false)
	public deviceIDs: number[];

	// The transition time is not reported by the gateway
	// but it accepts it for a state change
	@ipsoKey("5712")
	@serializeWith(serializers.transitionTime)
	@deserializeWith(deserializers.transitionTime)
	public transitionTime: number = 0; // <float>

}

export type GroupOperation = Partial<Pick<Group, "onOff" | "dimmer" | "sceneId" | "transitionTime">>;

// TODO: Type annotation
function parseAccessoryLink(link): number[] {
	const hsLink = link["15002"];
	const deviceIDs = hsLink["9003"];
	return deviceIDs;
}
function toAccessoryLink(ids: number[]): any {
	return {
		15002: {
			9003: ids,
		},
	};
}
