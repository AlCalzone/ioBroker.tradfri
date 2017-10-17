// tslint:disable:variable-name

import { PropertyTransform } from "../ipso/ipsoObject";
import { Light } from "../ipso/light";
import { clamp, roundTo } from "../lib/math";
import { DictionaryLike } from "../lib/object-polyfill";
import { MAX_COLOR, predefinedColors, whiteSpectrumRange, whiteSpectrumTemp } from "./predefined-colors";

// ==========================
// WHITE SPECTRUM conversions

const whiteSpectrumToColorX: PropertyTransform = value => {
	const [min, max] = whiteSpectrumRange;
	// extrapolate 0-100% to [min..max]
	value = clamp(value, 0, 100);
	return roundTo(min + value / 100 * (max - min), 0);
};
const whiteSpectrumFromColorX: PropertyTransform = value => {
	const [min, max] = whiteSpectrumRange;
	// interpolate "color percentage" from the colorX range of a lightbulb
	value = (value - min) / (max - min);
	value = clamp(value, 0, 1);
	return roundTo(value * 100, 0);
};

// ==========================
// RGB conversions
// see https://github.com/mikz/PhilipsHueSDKiOS/blob/master/ApplicationDesignNotes/RGB%20to%20xy%20Color%20conversion.md

function rgbToCIExy(r: number, g: number, b: number) {
	// transform [0..255] => [0..1]
	[r, g, b] = [r, g, b].map(c => c / 255);
	// gamma correction
	[r, g, b] = [r, g, b].map(c => (c > 0.04045) ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92);
	// transform using wide RGB D65 formula
	const X = r * 0.649926 + g * 0.103455 + b * 0.197109;
	const Y = r * 0.234327 + g * 0.743075 + b * 0.022598;
	const Z = r * 0.0000000 + g * 0.053077 + b * 1.035763;
	// calculate CIE xy
	const x = X / (X + Y + Z);
	const y = Y / (X + Y + Z);
	return {x, y};
}

function rgbFromCIExy(x: number, y: number) {
	// we don't know the actual gamut of the lamps, so we use the following triangle
	// G (0, 1) |\
	//          | \
	// B (0, 0) |__\ R (1, 0)
	// map the colors to the newest point on the triangle
	x = clamp(x, 0, 1);
	y = clamp(y, 0, 1);
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
	const [min, max] = whiteSpectrumRange;
	// convert to RGB
	let r = X * 1.612 - Y * 0.203 - Z * 0.302;
	let g = -X * 0.509 + Y * 1.412 + Z * 0.066;
	let b = X * 0.026 - Y * 0.072 + Z * 0.962;
	// reverse gamma correction
	[r, g, b] = [r, g, b].map(c => c <= 0.0031308 ? 12.92 * c : (1.0 + 0.055) * c ** (1.0 / 2.4) - 0.055);
	// transform back to [0..255]
	[r, g, b] = [r, g, b].map(c => Math.round(clamp(c, 0, 1) * 255));
	return {r, g, b};
}

// ===========================
// RGB serializers
// interpolate hue from [0..360] to [0..COLOR_MAX]
const hue_out: PropertyTransform = (value, light: Light) => {
	if (light != null && light.spectrum !== "rgb") return null; // hue is not supported

	value = clamp(value, 0, 360);
	return roundTo(value / 360 * MAX_COLOR, 0);
};
// interpolate hue from [0..COLOR_MAX] to [0..360]
const hue_in: PropertyTransform = (value, light: Light) => {
	value = clamp(value / MAX_COLOR, 0, 1);
	return roundTo(value * 360, 0);
};

// interpolate saturation from [0..100%] to [0..COLOR_MAX]
const saturation_out: PropertyTransform = (value, light: Light) => {
	if (light != null && light.spectrum !== "rgb") return null; // hue is not supported

	value = clamp(value, 0, 100);
	return roundTo(value / 100 * MAX_COLOR, 0);
};
// interpolate saturation from [0..COLOR_MAX] to [0..100%]
const saturation_in: PropertyTransform = (value, light: Light) => {
	value = clamp(value / MAX_COLOR, 0, 1);
	return roundTo(value * 100, 0);
};

// ===========================
// TRANSITION TIME conversions

// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_out: PropertyTransform = val => val * 10;
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_in: PropertyTransform = val => val / 10;

export const serializers = {
	transitionTime: transitionTime_out,
	hue: hue_out,
	saturation: saturation_out,
};

export const deserializers = {
	transitionTime: transitionTime_in,
	hue: hue_in,
	saturation: saturation_in,
};

export const conversions = {
	whiteSpectrumToColorX,
	whiteSpectrumFromColorX,
	rgbFromCIExy,
	rgbToCIExy,
};
