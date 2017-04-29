"use strict";
///
/// Stellt einen Promise-Wrapper für asynchrone Node-Funktionen zur Verfügung
///

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.promisify = promisify;
exports.waterfall = waterfall;
function promisify(fn, context) {
	return function () {
		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		context = context || this;
		return new Promise(function (resolve, reject) {
			fn.apply(context, [].concat(args, [function (error, result) {
				if (error) return reject(error);else return resolve(result);
			}]));
		});
	};
}

function waterfall() {
	for (var _len2 = arguments.length, fn = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
		fn[_key2] = arguments[_key2];
	}

	// Führt eine Reihe von Promises sequentiell aus
	// TODO: Rückgabewerte prüfen (ob da was zu viel ist)
	return fn.reduce(function (prev, cur) {
		return prev.then(cur);
	}, Promise.resolve());
}
//# sourceMappingURL=../maps/lib/promises.js.map
