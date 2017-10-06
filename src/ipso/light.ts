import { deserializers, serializers } from "../lib/conversions";
import { IPSODevice } from "./ipsoDevice";
import { deserializeWith, ipsoKey, IPSOObject, PropertyTransform, required, serializeWith } from "./ipsoObject";

// see https://github.com/hreichert/smarthome/blob/master/extensions/binding/org.eclipse.smarthome.binding.tradfri/src/main/java/org/eclipse/smarthome/binding/tradfri/internal/TradfriColor.java
// for some color conversion

export class Light extends IPSODevice {

	@ipsoKey("5706")
	public color: string = "f1e0b5"; // hex string

	@ipsoKey("5707")
	public hue: number = 0; // TODO: TODO: range unknown! [0-359]?
	@ipsoKey("5708")
	public saturation: number = 0; // TODO: range unknown!

	@ipsoKey("5709")
	@serializeWith(serializers.color)
	@deserializeWith(deserializers.color)
	public colorX: number = 0; // int

	@ipsoKey("5710")
	public colorY: number = 0; // int

	@ipsoKey("5711")
	public colorTemperature: number = 0; // TODO: range unknown!

	@ipsoKey("5712")
	@required
	@serializeWith(serializers.transitionTime)
	@deserializeWith(deserializers.transitionTime)
	public transitionTime: number = 0.5; // <float>

	@ipsoKey("5805")
	public cumulativeActivePower: number = 0.0; // <float>

	@ipsoKey("5851")
	public dimmer: number = 0; // <int> [0..254]

	@ipsoKey("5850")
	public onOff: boolean = false;

	@ipsoKey("5852")
	public onTime: number = 0; // <int>

	@ipsoKey("5820")
	public powerFactor: number = 0.0; // <float>

	@ipsoKey("5701")
	public unit: string = "";

}
