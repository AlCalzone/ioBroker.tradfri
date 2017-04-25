"use strict";
///
/// Stellt einen Promise-Wrapper für asynchrone Node-Funktionen zur Verfügung
///

export function promisify(fn, context) {
	return function (...args) {
		context = context || this;
		return new Promise(function (resolve, reject) {
			fn.apply(context, [...args, function (error, result) {
				if (error)
					return reject(error);
				else
					return resolve(result);
			}]);
		});
	};
}

export function waterfall(...fn) {
	// Führt eine Reihe von Promises sequentiell aus
	// TODO: Rückgabewerte prüfen (ob da was zu viel ist)
	return fn.reduce(
		(prev, cur) => prev.then(cur),
		Promise.resolve()
	);
}