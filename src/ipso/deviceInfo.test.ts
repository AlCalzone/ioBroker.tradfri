// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");

import { expect } from "chai";
import { DeviceInfo } from "./deviceInfo";
// tslint:disable:no-unused-expression

const template = {
	0: "IKEA of Sweden",
	1: "Some long-ass model name",
	2: "",
	3: "1.2.217",
	6: 1,
};
const templateWithBattery = {
	0: "IKEA of Sweden",
	1: "Some long-ass model name",
	2: "",
	3: "1.2.217",
	6: 1,
	9: 99,
};

const di = new DeviceInfo().parse(template);
const diBat = new DeviceInfo().parse(templateWithBattery);

describe("ipso/deviceInfo => parse() =>", () => {

	it("should parse correctly", () => {
		expect(di.manufacturer).to.equal(template["0"]);
		expect(di.modelNumber).to.equal(template["1"]);
		expect(di.serialNumber).to.equal(template["2"]);
		expect(di.firmwareVersion).to.equal(template["3"]);
		expect(di.power).to.equal(template["6"]);
		expect(diBat.battery).to.equal(templateWithBattery["9"]);
	});
	it("the parsed battery level should be undefined if not present", () => {
		expect(di.battery).to.be.undefined;
		expect(diBat.battery).to.not.be.undefined;
	});

});

// nothing special to test for with serialization, e.g. no required properties

// {
//     3: {
//         0: "IKEA of Sweden",
//         1: modelName,
//         2: "",
//         3: "1.2.217",
//         6: 1,
//     },
//     3311: [
//         {
//             5706: "f5faf6",
//             5707: 0,
//             5708: 0,
//             5709: 24930,
//             5710: 24694,
//             5711: 0,
//             5850: 1,
//             5851: 254,
//             9003: 0,
//         },
//     ],
//     5750: 2,
//     9001: modelName,
//     9002: 1499440525,
//     9003: 65538,
//     9019: 1,
//     9020: 1507456927,
//     9054: 0,
// }
