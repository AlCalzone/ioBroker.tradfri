// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { assert, expect } from "chai";
import { Accessory } from "./accessory";
import { DeviceInfo } from "./deviceInfo";
import { Light } from "./light";
// tslint:disable:no-unused-expression

const template = {
	3: {
		0: "IKEA of Sweden",
		// we need to use a RGB bulb here,
		// so all properties get serialized
		1: "TRADFRI bulb E27 CWS opal 600",
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
	9001: "Some long-ass model name",
	9002: 1499440525,
	9003: 65538,
	9019: 1,
	9020: 1507456927,
	9054: 0,
};

const acc = new Accessory().parse(template);

describe("ipso/accessory => ", () => {

	it("should parse correctly", () => {
		assert(acc.deviceInfo instanceof DeviceInfo, "the deviceInfo must be of type DeviceInfo");
		expect(acc.lightList).to.have.length(1);
		assert(acc.lightList[0] instanceof Light, "the light array items must be of type Light");
		expect(acc.type).to.equal(template["5750"]);
	});

	it("should serialize correctly", () => {
		// note: we manually check for property equality since we're going to
		// serialize a few more values than the gateway reports
		const serialized = acc.serialize();

		// check all properties except the light list
		for (const key in Object.keys(serialized)) {
			if (key !== "3311") expect(serialized[key]).to.deep.equal(template[key]);
		}

		// compare all lights
		expect(serialized["3311"].length).to.equal(template["3311"].length);
		for (let i = 0; i < serialized["3311"].length; i++) {
			expect(serialized["3311"][i]).to.deep.include(template["3311"][i]);
		}
	});

	it("should serialize correctly when a reference is given", () => {
		const original = acc.clone();
		expect(acc.serialize(original)).to.deep.equal({});

		acc.merge({name: "Test"});
		expect(acc.serialize(original)).to.deep.equal({9001: "Test"});

		acc.lightList[0].merge({name: "Blub"});
		// note: we use include here, since Light has the required property transitionTime
		expect(acc.serialize(original)["3311"][0]).to.include({9001: "Blub"});
	});
});
