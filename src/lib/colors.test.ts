import { expect } from "chai";
import { normalizeHexColor } from "./colors";
// tslint:disable:no-unused-expression

describe("lib/colors => normalizeHexColor() =>", () => {
	it("should not change valid hex colors without #", () => {
		const sampleColors = ["000000", "0a0a0a", "A5A5A5", "FFEEDD", "abcdef"];
		for (const hex of sampleColors) {
			expect(normalizeHexColor(hex)).to.equal(hex);
		}
	});

	it("should strip the prefix off strings that might represent hex colors", () => {
		const sampleColors = [
			"#000000",
			".,-0a0a0a",
			"####A5A5A5",
			"%FFEEDD",
			"$$$abcdef",
		];
		for (const hex of sampleColors) {
			expect(normalizeHexColor(hex)).to.equal(hex.substr(-6));
		}
	});

	it("should return undefined for stuff that's not almost a hex string", () => {
		const sampleColors = [
			"A000000",
			"Z0a0a0a",
			"6A5A5A5",
			"aFFEEDD",
			"a_abcdef",
		];
		for (const hex of sampleColors) {
			expect(normalizeHexColor(hex)).to.be.undefined;
		}
	});
});
