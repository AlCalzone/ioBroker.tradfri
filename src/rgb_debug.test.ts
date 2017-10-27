import { expect } from "chai";
import { Light } from "./ipso/light";
import { conversions } from "./modules/conversions";
import { predefinedColors } from "./modules/predefined-colors";
// tslint:disable:no-unused-expression

describe("RGB debug =>", () => {

	const rawLight = {
		5706: "0",
		5707: 0,
		5708: 0,
		5709: 11469,
		5710: 3277,
		5711: 0,
		5850: 1,
		5851: 254,
		9003: 0,
	};
	const light = new Light().parse(rawLight).createProxy();

	it("debugs", () => {
		let {r, g, b} = conversions.rgbFromString("bada55");
		console.log({r, g, b});
		const {x, y, Y} = conversions.rgbToCIExyY(r, g, b);
		console.log({_x: x * 65279, _y: y * 65279});
		console.log({x, y, Y});
		({r, g, b} = conversions.rgbFromCIExyY(x, y));
		console.log({r, g, b});
		const hex = conversions.rgbToString(r, g, b);
		console.log(hex);
	});

});
