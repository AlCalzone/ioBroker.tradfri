import {expect, use } from "chai";
import * as chaiAsPromised from "chai-as-promised";

before(() => {
	use(chaiAsPromised);
});

import { createDeferredPromise } from "./defer-promise";
// tslint:disable:no-unused-expression

describe("lib/defer-promise => createDeferredPromise() =>", () => {

	const promiseRes = createDeferredPromise<boolean>();

	it("should resolve correctly", () => {
		return expect(promiseRes).to.become(true);
	});

	promiseRes.resolve(true);

	it("should be fulfilled", () => {
		return expect(promiseRes).to.be.fulfilled;
	});

	const promiseRej = createDeferredPromise<boolean>();

	promiseRej.reject();

	it("should be rejected", () => {
		return expect(promiseRej).to.be.rejected;
	});

});
