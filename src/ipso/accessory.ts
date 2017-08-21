import DeviceInfo from "./deviceInfo";
import IPSODevice from "./ipsoDevice";
import {IPSOObject, PropertyDefinition} from "./ipsoObject";
import Light from "./light";

export default class Accessory extends IPSODevice {

	constructor(sourceObj, ...properties: PropertyDefinition[]) {
		super(sourceObj, ...properties,
			["5750", "type", 0], // <AccessoryType>
			["3", "deviceInfo", null, obj => new DeviceInfo(obj)], // <DeviceInfo>
			["9019", "alive", false], // <boolean>
			["9020", "lastSeen", 0], // <long>
			["3311", "lightList", [], obj => new Light(obj)], // <[Light]>
			["3312", "plugList", [], obj => new IPSODevice(obj)], // <[Plug]> // seems unsupported atm.
			["3300", "sensorList", [], obj => new IPSODevice(obj)], // <[Sensor]> // seems unsupported atm.
			["15009", "switchList", [], obj => new IPSODevice(obj)], // <[Switch]> // seems unsupported atm.
			["9054", "otaUpdateState", 0], // <boolean?>
		);
	}
}
