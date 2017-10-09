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
		1: "Some long-ass model name",
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

describe("ipso/accessory => parse() =>", () => {

	it("should parse correctly", () => {
		assert(acc.deviceInfo instanceof DeviceInfo);
		expect(acc.lightList).to.have.length(1);
		assert(acc.lightList[0] instanceof Light);
		expect(acc.type).to.equal(template["5750"]);
	});

});
