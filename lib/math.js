"use strict";

// limits a value to the range given by min/max

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.clamp = clamp;
exports.roundTo = roundTo;
function clamp(value, min, max) {
	if (min > max) {
		var _ref = [max, min];
		min = _ref[0];
		max = _ref[1];
	}
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

function roundTo(number, digits) {
	var exp = Math.pow(10, digits);
	return Math.round(number * exp) / exp;
}
//# sourceMappingURL=../maps/lib/math.js.map
