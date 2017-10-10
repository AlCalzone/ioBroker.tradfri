import { expect } from "chai";
import { Enumeration, getEnumValueAsName } from "./enums";
// tslint:disable:no-unused-expression

describe("lib/enums => getEnumValueAsName() =>", () => {

	const theEnum: Enumeration = {
		asdfg: 1234,
		blub: 0x815,
		test: 456,
	};
	const withDupes: Enumeration = {
		asdfg: 1234,
		blub: 0x815,
		test: 456,
		test2: 456,
	};

	it("should map values to names", () => {
		for (const name of Object.keys(theEnum)) {
			expect(getEnumValueAsName(theEnum, theEnum[name])).to.equal(name);
		}
	});

	it("should return the first key if there are dupes", () => {
		expect(getEnumValueAsName(withDupes, withDupes.test2)).to.equal("test");
	});

	it("should return an empty string for non-enum values", () => {
		expect(getEnumValueAsName(theEnum, 0)).to.equal("");
	});

});
