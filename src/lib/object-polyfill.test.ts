import { expect } from "chai";
import { bury, dig } from "./object-polyfill";
// tslint:disable:no-unused-expression

describe("lib/object-polyfill => bury() =>", () => {

	it("should work with nested properties", () => {
		const target = { a: "a", b: { c: "c" }, d: "d" };
		bury(target, "a", "A");
		bury(target, "b.c", "C");
		const expected = { a: "A", b: { c: "C" }, d: "d" };
		expect(target).to.deep.equal(expected);
	});

	it("should work with non-existing properties", () => {
		const target = { a: "a", b: { c: "c" }, d: "d" };
		bury(target, "e", "E");
		const expected = { a: "a", b: { c: "c" }, d: "d", e: "E" };
		expect(target).to.deep.equal(expected);
	});

	it("should work with arrays", () => {
		const target = { a: [{ b: "b" }, { c: "c" }] };
		bury(target, "a.[1].c", "C");
		bury(target, "a.[1].d", "d");
		const expected = { a: [{ b: "b" }, { c: "C", d: "d" }] };
		expect(target).to.deep.equal(expected);
	});

});

describe("lib/object-polyfill => dig() =>", () => {

	const source = { a: "A", b: ["B", { c: "C" }], d: { e: "E" } };

	it("should find the correct property", () => {
		expect(dig(source, "a")).to.equal("A");
	});

	it("should work with nested properties", () => {
		expect(dig(source, "d.e")).to.equal("E");
	});

	it("should work with arrays", () => {
		expect(dig(source, "b.[0]")).to.be.equal("B");
		expect(dig(source, "b.[1]")).to.deep.equal({ c: "C" });
	});
});
