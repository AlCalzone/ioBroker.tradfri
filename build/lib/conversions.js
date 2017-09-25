"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var math_1 = require("./math");
exports.serializers = {
    color: (function (value) {
        var _a = [24930, 33135], min = _a[0], max = _a[1];
        // extrapolate 0-100% to [min..max]
        return math_1.roundTo(min + value / 100 * (max - min), 0);
    }),
    // the sent value is in 10ths of seconds, we're working with seconds
    transitionTime: (function (val) { return val * 10; }),
};
exports.deserializers = {
    color: (function (value) {
        var _a = [24930, 33135], min = _a[0], max = _a[1];
        // interpolate "color percentage" from the colorX range of a lightbulb
        value = (value - min) / (max - min);
        value = math_1.clamp(value, 0, 1);
        return math_1.roundTo(value * 100, 0);
    }),
    // the sent value is in 10ths of seconds, we're working with seconds
    transitionTime: (function (val) { return val / 10; }),
};
//# sourceMappingURL=conversions.js.map