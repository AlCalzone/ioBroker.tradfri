"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
exports.serializers = {
    color: ((value) => {
        const [min, max] = [24930, 33135];
        // extrapolate 0-100% to [min..max]
        value = math_1.clamp(value, 0, 100);
        return math_1.roundTo(min + value / 100 * (max - min), 0);
    }),
    // the sent value is in 10ths of seconds, we're working with seconds
    transitionTime: (val => val * 10),
};
exports.deserializers = {
    color: ((value) => {
        const [min, max] = [24930, 33135];
        // interpolate "color percentage" from the colorX range of a lightbulb
        value = (value - min) / (max - min);
        value = math_1.clamp(value, 0, 1);
        return math_1.roundTo(value * 100, 0);
    }),
    // the sent value is in 10ths of seconds, we're working with seconds
    transitionTime: (val => val / 10),
};
//# sourceMappingURL=conversions.js.map