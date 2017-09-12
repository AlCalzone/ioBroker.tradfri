import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

// contains information about a specific device
export class DeviceInfo extends IPSOObject {

	@ipsoKey("9")
	public battery: number = 0;

	@ipsoKey("3")
	public firmwareVersion: string = "";

	@ipsoKey("0")
	public manufacturer: string = "";

	@ipsoKey("1")
	public modelNumber: string = "";

	@ipsoKey("6")
	public power: number = 0;

	@ipsoKey("2")
	public serialNumber: string = "";

}
