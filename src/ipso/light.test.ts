// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { Accessory } from "./accessory";
import { Spectrum } from "./light";

function buildAccessory(modelName: string) {
	return {
		3: {
			0: "IKEA of Sweden",
			1: modelName,
			2: "",
			3: "1.2.217",
			6: 1,
		},
		3311: [
			{
				5706: "f5faf6",
				5707: 0,
				5708: 0,
				5709: 24930,
				5710: 24694,
				5711: 0,
				5850: 1,
				5851: 254,
				9003: 0,
			},
		],
		5750: 2,
		9001: modelName,
		9002: 1499440525,
		9003: 65538,
		9019: 1,
		9020: 1507456927,
		9054: 0,
	};
}

describe("ipso/light => feature tests =>", () => {

	// setup feature table
	interface Device {
		name: string;
		isDimmable: boolean;
		isSwitchable: boolean;
		spectrum: Spectrum;
	}
	const deviceTable: Device[] = [];
	function add(name: string, switchable: boolean, dimmable: boolean, spectrum: Spectrum) {
		deviceTable.push({ name, isDimmable: dimmable, isSwitchable: switchable, spectrum });
	}

	// white spectrum lamps
	add("TRADFRI bulb E27 WS clear 950lm", true, true, "white");
	add("TRADFRI bulb E27 WS opal 950lm", true, true, "white");
	add("TRADFRI bulb E14 WS opal 400lm", true, true, "white");
	add("TRADFRI bulb E12 WS opal 400lm", true, true, "white");
	add("TRADFRI bulb E26 WS clear 950lm", true, true, "white");
	add("TRADFRI bulb E26 WS opal 980lm", true, true, "white");
	add("TRADFRI bulb E27 WS opal 980lm", true, true, "white");

	// single-colored lamps
	add("TRADFRI bulb E26 opal 1000lm", true, true, "none");
	add("TRADFRI bulb E27 opal 1000lm", true, true, "none");
	add("TRADFRI bulb E26 W opal 1000lm", true, true, "none");
	add("TRADFRI bulb E27 W opal 1000lm", true, true, "none");
	add("TRADFRI bulb E14 W op/ch 400lm", true, true, "none");
	add("TRADFRI bulb E12 W op/ch 400lm", true, true, "none");

	// rgb lamps
	add("TRADFRI bulb E27 C/WS opal 600lm", true, true, "rgb");
	add("TRADFRI bulb E14 C/WS opal 600lm", true, true, "rgb");
	add("TRADFRI bulb E27 C/WS opal 600", true, true, "rgb");
	add("TRADFRI bulb E27 CWS opal 600", true, true, "rgb");
	add("TRADFRI bulb E26 CWS opal 600", true, true, "rgb");
	add("TRADFRI bulb E14 CWS opal 600", true, true, "rgb");
	add("TRADFRI bulb E12 CWS opal 600", true, true, "rgb");

	it("supported features should be detected correctly", () => {
		for (const device of deviceTable) {
			const acc = new Accessory().parse(buildAccessory(device.name));
			const light = acc.lightList[0];

			expect(light.isSwitchable()).to.equal(device.isSwitchable, `${device.name} should ${device.isSwitchable ? "" : "not "}be switchable`);
			expect(light.isDimmable()).to.equal(device.isDimmable, `${device.name} should ${device.isDimmable ? "" : "not "}be dimmable`);
			expect(light.getSpectrum()).to.equal(device.spectrum, `${device.name} should have spectrum ${device.spectrum}`);
		}
	});

});
