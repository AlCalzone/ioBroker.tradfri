"use strict";
///
/// Stellt Erweiterungsmethoden für Arrays bereit
///

/// Gibt die Schnittmenge zweier numerischer Arrays aus,
/// es wird angenommen, dass sie schon sortiert sind

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.intersect = intersect;
exports.except = except;
exports.range = range;
exports.firstOrDefault = firstOrDefault;
function intersect(a, b) {
	var ai = 0;
	var bi = 0;
	var ret = [];

	while (ai < a.length && bi < b.length) {
		if (a[ai] < b[bi]) ai++;else if (a[ai] > b[bi]) bi++;else {
			ret.push(a[ai]);
			ai++;
			bi++;
		}
	}

	return ret;
}

/// gibt die Elemente zurück, die in a, aber nicht in b sind.
function except(a, b) {
	return a.filter(function (el) {
		return b.indexOf(el) === -1;
	});
}

/// Erzeugt ein Range-Array
function range(min, max) {
	// Potentiell Reihenfolge tauschen
	if (min > max) {
		;

		var _ref = [min, max];
		max = _ref[0];
		min = _ref[1];
	}var N = max - min + 1;
	return Array.from(new Array(N), function (_, index) {
		return index + min;
	});
}

// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
function firstOrDefault(arr, filter) {
	for (var i = 0; i < arr.length; i++) {
		if (filter(arr[i])) return arr[i];
	}
	return null;
}
//# sourceMappingURL=../maps/lib/array-extensions.js.map
