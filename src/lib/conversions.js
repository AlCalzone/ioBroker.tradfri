"use strict";
import { clamp, roundTo } from "./math";

// custom conversions for tradfri states
export default {
	"color": function (direction, value) {
		const min = 24930, max = 33135;
		if (direction === "in") {
			// interpolate "color percentage" from the colorX range of a lightbulb
			value = (value - min) / (max - min);
			value = clamp(value, 0, 1);
			return roundTo(value * 100, 0);
		} else {
			// extrapolate 0-100% to [min..max]
			return roundTo(min + value / 100 * (max - min), 0);
		}
	}
}