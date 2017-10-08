import { expect } from "chai";
import { deserializers, serializers } from "./conversions";
import { MAX_COLOR, predefinedColors, whiteSpectrumRange } from "./predefined-colors";
// tslint:disable:no-unused-expression

describe("tradfri/conversions => whiteSpectrum <=> colorX =>", () => {

	const serialize = serializers.whiteSpectrumToColorX;
	const deserialize = deserializers.whiteSpectrumFromColorX;

	// The white spectrum expressed in colorX values, as defined in the app
	const [min, max] = whiteSpectrumRange;

	const inputs = [0, 50, 100];
	const outputs = [min, Math.round((min + max) / 2), max];

	it(`serialize: 0..100% should map to ${min}..${max}`, () => {
		for (let i = 0; i < inputs.length; i++) {
			expect(serialize(inputs[i])).to.equal(outputs[i]);
		}
	});
	it(`deserialize: ${min}..${max} should map to 0..100%`, () => {
		for (let i = 0; i < outputs.length; i++) {
			expect(deserialize(outputs[i])).to.equal(inputs[i]);
		}
	});

});

describe("tradfri/conversions => transitionTime() =>", () => {

	const serialize = serializers.transitionTime;
	const deserialize = deserializers.transitionTime;

	const inputs = [0, .1, .5, 1.0];
	const outputs = [0, 1, 5, 10];

	it("serialize: transmitted values should be 1/10th of seconds", () => {
		for (let i = 0; i < inputs.length; i++) {
			expect(serialize(inputs[i])).to.equal(outputs[i]);
		}
	});
	it("deserialize: transmitted values should be 1/10th of seconds", () => {
		for (let i = 0; i < outputs.length; i++) {
			expect(deserialize(outputs[i])).to.equal(inputs[i]);
		}
	});

});
