"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _math = require("./math");

// custom conversions for tradfri states
exports.default = {
	"color": function color(direction, value) {
		var min = 24930,
		    max = 33135;
		if (direction === "in") {
			// interpolate "color percentage" from the colorX range of a lightbulb
			value = (value - min) / (max - min);
			value = (0, _math.clamp)(value, 0, 1);
			return (0, _math.roundTo)(value * 100, 0);
		} else {
			// extrapolate 0-100% to [min..max]
			return (0, _math.roundTo)(min + value / 100 * (max - min), 0);
		}
	}
};
//# sourceMappingURL=../maps/lib/conversions.js.map
