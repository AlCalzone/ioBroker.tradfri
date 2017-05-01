"use strict";
///
/// Stellt eine Helferfunktion zur Verfügung, mit der ein Promise extern ausgelöst werden kann
///

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = deferredPromise;
function deferredPromise() {
	var res = void 0,
	    rej = void 0;

	var promise = new Promise(function (resolve, reject) {
		res = resolve;
		rej = reject;
	});

	promise.resolve = res;
	promise.reject = rej;

	return promise;
}
//# sourceMappingURL=../maps/lib/defer-promise.js.map
