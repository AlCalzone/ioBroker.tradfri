import { expect } from "chai";
import { str2regex } from "./str2regex";
// tslint:disable:no-unused-expression

describe("lib/str2regex => ", () => {

	it("should replace wildcards", () => {
		expect(str2regex("*").toString()).to.equal("/.*/");
	});
	it("should replace dots", () => {
		expect(str2regex(".").toString()).to.equal("/\\./");
	});
	it("should replace combined patterns", () => {
		expect(str2regex("*.*").toString()).to.equal("/.*\\..*/");
	});

});
