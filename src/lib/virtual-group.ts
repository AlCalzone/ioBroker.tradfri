import { LightOperation } from "../ipso/light";
import { entries } from "./object-polyfill";

export class VirtualGroup {

	constructor(public readonly instanceId: number) {
	}

	public name: string;
	public onOff: boolean = false; // <bool>
	public dimmer: number = 0; // <int> [0..254]
	public colorTemperature: number = 0; // int
	public transitionTime: number = 0; // <float>
	public color: string; // int
	public hue: number = 0; // int
	public saturation: number = 0; // int

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
