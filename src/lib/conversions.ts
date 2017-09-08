import { clamp, roundTo } from "./math";
import { DictionaryLike } from "./object-polyfill";

export type Conversion = (direction: "in" | "out", value: any) => any;

// custom conversions for tradfri states
export default {
	color: (direction, value) => {
		const [min, max] = [24930, 33135];
		if (direction === "in") {
			// interpolate "color percentage" from the colorX range of a lightbulb
			value = (value - min) / (max - min);
			value = clamp(value, 0, 1);
			return roundTo(value * 100, 0);
		} else {
			// extrapolate 0-100% to [min..max]
			return roundTo(min + value / 100 * (max - min), 0);
		}
	},
} as DictionaryLike<Conversion>;
