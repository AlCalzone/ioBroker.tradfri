"use strict";
///
/// Stellt eine Helferfunktion zur Verfügung, mit der ein Promise extern ausgelöst werden kann
///

export default function deferredPromise() {
	let res, rej;

	const promise = new Promise((resolve, reject) => {
		res = resolve;
		rej = reject;
	});

	promise.resolve = res;
	promise.reject = rej;

	return promise;
}