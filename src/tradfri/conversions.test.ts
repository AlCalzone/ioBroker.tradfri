import { expect } from "chai";
import { deserializers, serializers } from "./conversions";
// tslint:disable:no-unused-expression

describe("lib/conversions => color() =>", () => {

	const serialize = serializers.whiteTemperature;
	const deserialize = deserializers.whiteTemperature;

	const inputs = [0, 50, 100];
	const outputs = [24930, Math.round((24930 + 33135) / 2), 33135];

	it("serialize: 0..100% should map to 24930..33135", () => {
		for (let i = 0; i < inputs.length; i++) {
			expect(serialize(inputs[i])).to.equal(outputs[i]);
		}
	});
	it("deserialize: 24930..33135 should map to 0..100%", () => {
		for (let i = 0; i < outputs.length; i++) {
			expect(deserialize(outputs[i])).to.equal(inputs[i]);
		}
	});

});

describe("lib/conversions => transitionTime() =>", () => {

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