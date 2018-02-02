/** limits a value to the range given by min/max */
export function clamp(value: number, min: number, max: number): number {
	if (min > max) {
		[min, max] = [max, min];
	}
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

export function roundTo(value: number, digits: number): number {
	const exp = Math.pow(10, digits);
	return Math.round(value * exp) / exp;
}
