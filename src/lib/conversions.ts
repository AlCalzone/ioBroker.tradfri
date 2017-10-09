import { PropertyTransform } from "../ipso/ipsoObject";
import { clamp, roundTo } from "./math";
import { DictionaryLike } from "./object-polyfill";

export const serializers = {
	color: ((value) => {
		const [min, max] = [24930, 33135];
		// extrapolate 0-100% to [min..max]
		value = clamp(value, 0, 100);
		return roundTo(min + value / 100 * (max - min), 0);
	}) as PropertyTransform,

	// the sent value is in 10ths of seconds, we're working with seconds
	transitionTime: (val => val * 10) as PropertyTransform,
};

export const deserializers = {
	color: ((value) => {
		const [min, max] = [24930, 33135];
		// interpolate "color percentage" from the colorX range of a lightbulb
		value = (value - min) / (max - min);
		value = clamp(value, 0, 1);
		return roundTo(value * 100, 0);
	}) as PropertyTransform,

	// the sent value is in 10ths of seconds, we're working with seconds
	transitionTime: (val => val / 10) as PropertyTransform,
};
