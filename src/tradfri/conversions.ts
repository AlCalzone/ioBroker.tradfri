// tslint:disable:variable-name

import { PropertyTransform } from "../ipso/ipsoObject";
import { clamp, roundTo } from "../lib/math";
import { DictionaryLike } from "../lib/object-polyfill";
import { MAX_COLOR, predefinedColors, whiteSpectrumRange } from "./predefined-colors";

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
// TRANSITION TIME conversions

// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_out: PropertyTransform = val => val * 10;
// the sent value is in 10ths of seconds, we're working with seconds
const transitionTime_in: PropertyTransform = val => val / 10;

export const serializers = {
	whiteSpectrumToColorX,
	transitionTime: transitionTime_out,
};

export const deserializers = {
	whiteSpectrumFromColorX,
	transitionTime: transitionTime_in,
};
