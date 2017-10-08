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

// ===========================
// RGB conversions
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
	whiteSpectrumToColorX: whiteSpectrumToColorX,
	transitionTime: transitionTime_out,
	hue: hue_out,
	saturation: saturation_out,
};

export const deserializers = {
	whiteSpectrumFromColorX: whiteSpectrumFromColorX,
	transitionTime: transitionTime_in,
	hue: hue_in,
	saturation: saturation_in,
};
