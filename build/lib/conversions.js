"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var math_1 = require("./math");
// custom conversions for tradfri states
exports.default = {
    color: function (direction, value) {
        var _a = [24930, 33135], min = _a[0], max = _a[1];
        if (direction === "in") {
            // interpolate "color percentage" from the colorX range of a lightbulb
            value = (value - min) / (max - min);
            value = math_1.clamp(value, 0, 1);
            return math_1.roundTo(value * 100, 0);
        }
        else {
            // extrapolate 0-100% to [min..max]
            return math_1.roundTo(min + value / 100 * (max - min), 0);
        }
    },
    transitionTime: function (direction, value) {
        if (direction === "in") {
            return value / 10;
        }
        else {
            return value * 10;
        }
    }
};
//# sourceMappingURL=conversions.js.map