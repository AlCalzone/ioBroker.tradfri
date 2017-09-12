import { DeviceInfo } from "./deviceInfo";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";
import { Light } from "./light";

// list of known endpoints defined on the gateway
export enum AccessoryTypes {
	remote = 0,
	lightbulb = 2,
	// TODO: find out the other ones
}

export class Accessory extends IPSODevice {

	@ipsoKey("5750")
	public type: AccessoryTypes = AccessoryTypes.remote;

	@ipsoKey("3")
	@deserializeWith(obj => new DeviceInfo().parse(obj))
	public deviceInfo: DeviceInfo = null;

	@ipsoKey("9019")
	public alive: boolean = false;

	@ipsoKey("9020")
	public lastSeen: number = 0;

	@ipsoKey("3311")
	@deserializeWith(obj => new Light().parse(obj))
	public lightList: Light[];

	@ipsoKey("3312")
	@deserializeWith(obj => new IPSODevice().parse(obj))
	public plugList: IPSODevice[]; // <[Plug]> // seems unsupported atm.

	@ipsoKey("3300")
	@deserializeWith(obj => new IPSODevice().parse(obj))
	public sensorList: IPSODevice[]; // <[Sensor]> // seems unsupported atm.

	@ipsoKey("15009")
	@deserializeWith(obj => new IPSODevice().parse(obj))
	public switchList: IPSODevice[]; // <[Switch]> // seems unsupported atm.

	@ipsoKey("9054")
	public otaUpdateState: number = 0; // boolean?

}
