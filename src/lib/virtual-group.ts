import { LightOperation } from "../ipso/light";
import { entries } from "./object-polyfill";

export class VirtualGroup {

	constructor(public readonly instanceId: number) {
	}

	public name: string;
	public onOff: boolean; // <bool>
	public dimmer: number; // <int> [0..254]
	public colorTemperature: number; // int
	public transitionTime: number; // <float>
	public color: string; // int
	public hue: number; // int
	public saturation: number; // int

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
