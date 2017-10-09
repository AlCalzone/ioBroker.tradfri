import { LightOperation } from "../ipso/light";
import { entries } from "./object-polyfill";

export class VirtualGroup {

	constructor(public readonly instanceId: number) {
	}

	public onOff: boolean = false; // <bool>
	public dimmer: number = 0; // <int> [0..254]
	public colorX: number = 0; // int
	public transitionTime: number = 0; // <float>

	/**
	 * The instance ids of all devices combined in this group
	 */
	public deviceIDs: number[];

	/**
	 * Updates this virtual group's state with the changes contained in the given operation
	 */
	public merge(operation: LightOperation): void {
		for (const [prop, val] of entries(operation)) {
			if (this.hasOwnProperty(prop)) this[prop] = val;
		}
	}
}
