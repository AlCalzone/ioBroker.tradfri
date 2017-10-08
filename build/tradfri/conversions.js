"use strict";
// tslint:disable:variable-name
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("../lib/math");
const predefined_colors_1 = require("./predefined-colors");
// ==========================
// WHITE SPECTRUM conversions
const whiteSpectrumToColorX = value => {
    const [min, max] = predefined_colors_1.whiteSpectrumRange;
    // extrapolate 0-100% to [min..max]
    value = math_1.clamp(value, 0, 100);
    return math_1.roundTo(min + value / 100 * (max - min), 0);
};
const whiteSpectrumFromColorX = value => {
    const [min, max] = predefined_colors_1.whiteSpectrumRange;
    // interpolate "color percentage" from the colorX range of a lightbulb
    value = (value - min) / (max - min);
    value = math_1.clamp(value, 0, 1);
    return math_1.roundTo(value * 100, 0);
};
// ===========================
// TRANSITION TIME conversions
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_out = val => val * 10;
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_in = val => val / 10;
exports.serializers = {
    whiteSpectrumToColorX,
    transitionTime: transitionTime_out,
};
exports.deserializers = {
    whiteSpectrumFromColorX,
    transitionTime: transitionTime_in,
};
//# sourceMappingURL=conversions.js.map