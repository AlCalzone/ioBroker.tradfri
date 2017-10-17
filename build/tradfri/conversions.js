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
// ==========================
// RGB conversions
// see https://github.com/mikz/PhilipsHueSDKiOS/blob/master/ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md
function rgbToCIExy(r, g, b) {
    // transform [0..255] => [0..1]
    [r, g, b] = [r, g, b].map(c => c / 255);
    // gamma correction
    [r, g, b] = [r, g, b].map(c => (c > 0.04045) ? Math.pow(((c + 0.055) / 1.055), 2.4) : c / 12.92);
    // transform using wide RGB D65 formula
    const X = r * 0.649926 + g * 0.103455 + b * 0.197109;
    const Y = r * 0.234327 + g * 0.743075 + b * 0.022598;
    const Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;
    // calculate CIE xy
    const x = X / (X + Y + Z);
    const y = Y / (X + Y + Z);
    return { x, y };
}
function rgbFromCIExy(x, y) {
    // we don't know the actual gamut of the lamps, so we use the following triangle
    // G (0, 1) |\
    //          | \
    // B (0, 0) |__\ R (1, 0)
    // map the colors to the newest point on the triangle
    x = math_1.clamp(x, 0, 1);
    y = math_1.clamp(y, 0, 1);
    if (x + y > 1) {
        // this is easy for the above triangle
        const delta = (x + y - 1) / 2;
        x -= delta;
        y -= delta;
    }
    // calculate X/Y/Z
    const z = 1 - x - y;
    const Y = 1; // full brightness
    const X = (Y / y) * x;
    const Z = (Y / y) * z;
    const [min, max] = predefined_colors_1.whiteSpectrumRange;
    // convert to RGB
    let r = X * 1.612 - Y * 0.203 - Z * 0.302;
    let g = -X * 0.509 + Y * 1.412 + Z * 0.066;
    let b = X * 0.026 - Y * 0.072 + Z * 0.962;
    // reverse gamma correction
    [r, g, b] = [r, g, b].map(c => c <= 0.0031308 ? 12.92 * c : (1.0 + 0.055) * Math.pow(c, (1.0 / 2.4)) - 0.055);
    // transform back to [0..255]
    [r, g, b] = [r, g, b].map(c => math_1.clamp(c, 0, 1) * 255);
    return { r, g, b };
}
// ===========================
// RGB serializers
// interpolate hue from [0..360] to [0..COLOR_MAX]
const hue_out = (value, light) => {
    if (light != null && light.spectrum !== "rgb")
        return null; // hue is not supported
    value = math_1.clamp(value, 0, 360);
    return math_1.roundTo(value / 360 * predefined_colors_1.MAX_COLOR, 0);
};
// interpolate hue from [0..COLOR_MAX] to [0..360]
const hue_in = (value, light) => {
    value = math_1.clamp(value / predefined_colors_1.MAX_COLOR, 0, 1);
    return math_1.roundTo(value * 360, 0);
};
// interpolate saturation from [0..100%] to [0..COLOR_MAX]
const saturation_out = (value, light) => {
    if (light != null && light.spectrum !== "rgb")
        return null; // hue is not supported
    value = math_1.clamp(value, 0, 100);
    return math_1.roundTo(value / 100 * predefined_colors_1.MAX_COLOR, 0);
};
// interpolate saturation from [0..COLOR_MAX] to [0..100%]
const saturation_in = (value, light) => {
    value = math_1.clamp(value / predefined_colors_1.MAX_COLOR, 0, 1);
    return math_1.roundTo(value * 100, 0);
};
// ===========================
// TRANSITION TIME conversions
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_out = val => val * 10;
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_in = val => val / 10;
exports.serializers = {
    transitionTime: transitionTime_out,
    hue: hue_out,
    saturation: saturation_out,
};
exports.deserializers = {
    transitionTime: transitionTime_in,
    hue: hue_in,
    saturation: saturation_in,
};
exports.conversions = {
    whiteSpectrumToColorX,
    whiteSpectrumFromColorX,
    rgbFromCIExy,
    rgbToCIExy,
};
