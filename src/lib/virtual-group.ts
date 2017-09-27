import { Accessory } from "../ipso/accessory";
import { Global as _ } from "./global";
import { DictionaryLike } from "./object-polyfill";

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
	public instanceIDs: number[];

	public serialize(references: DictionaryLike<Accessory>): DictionaryLike<any> {
		const ret = {};
		for (const id of this.instanceIDs) {
			if (!(id in references)) {
				_.log(`VirtualGroup > cannot serialize command for accessory with id ${id}`, "warn");
				continue;
			}
			// get the reference value and a clone to modify
			const oldAcc = references[id];
			const newAcc = oldAcc.clone();
			// get the light to modify
			const light = newAcc.lightList[0];
			light.merge({
				onOff: this.onOff,
				dimmer: this.dimmer,
				colorX: this.colorX,
				colorY: 27000,
				transitionTime: this.transitionTime,
			});
			// and serialize the payload
			ret[id] = newAcc.serialize(oldAcc);
		}
		return ret;
	}
}
