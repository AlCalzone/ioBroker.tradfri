import { entries } from "alcalzone-shared/objects";
import type {
	AirPurifierOperation,
	BlindOperation,
	FanMode,
	LightOperation,
	PlugOperation,
	PowerRestoredAction,
} from "node-tradfri-client";

export class VirtualGroup {
	constructor(public readonly instanceId: number) {}

	public name: string | undefined;
	public whenPowerRestored: PowerRestoredAction | undefined;
	public onOff: boolean | undefined; // <bool>
	public dimmer: number | undefined; // <int> [0..100]
	public position: number | undefined; // <float> [0..100]
	public colorTemperature: number | undefined; // int
	public transitionTime: number | undefined; // <float>
	public color: string | undefined; // int
	public hue: number | undefined; // int
	public saturation: number | undefined; // int
	public controlsLocked: boolean | undefined;
	public fanMode: FanMode | undefined;
	public fanSpeed: number | undefined; // <int> [0..50]
	public statusLEDs: boolean | undefined;

	/**
	 * The instance ids of all devices combined in this group
	 */
	public deviceIDs: number[] | undefined;

	/**
	 * Updates this virtual group's state with the changes contained in the given operation
	 */
	public merge(
		operation:
			| LightOperation
			| BlindOperation
			| PlugOperation
			| AirPurifierOperation,
	): void {
		for (const [prop, val] of entries(operation)) {
			if (this.hasOwnProperty(prop))
				this[prop as keyof this] = val as any;
		}
	}
}
