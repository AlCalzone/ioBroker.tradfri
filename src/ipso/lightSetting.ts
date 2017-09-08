import { IPSODevice } from "./ipsoDevice";
import { IPSOObject, ipsoKey, serializeWith, deserializeWith, PropertyTransform, required } from "./ipsoObject";

export class LightSetting extends IPSODevice {

	@ipsoKey("5706")
	public color: string = "f1e0b5"; // hex string

	@ipsoKey("5707")
	public UNKNOWN1: number = 0; // ???
	@ipsoKey("5708")
	public UNKNOWN2: number = 0; // ???

	@ipsoKey("5709")
	public colorX: number = 0; // int
	@ipsoKey("5710")
	public colorY: number = 0; // int

	@ipsoKey("5711")
	public UNKNOWN3: number = 0; // ???

	@ipsoKey("5851")
	public dimmer: number = 0; // <int> [0..254]

	@ipsoKey("5850")
	public onOff: boolean = false; // <bool>

}
