"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** limits a value to the range given by min/max */
function clamp(value, min, max) {
    if (min > max) {
        _a = [max, min], min = _a[0], max = _a[1];
    }
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
    var _a;
}
exports.clamp = clamp;
function roundTo(value, digits) {
    var exp = Math.pow(10, digits);
    return Math.round(value * exp) / exp;
}
exports.roundTo = roundTo;
//# sourceMappingURL=math.js.map