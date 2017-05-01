"use strict";
///
/// Stellt Erweiterungsmethoden für Arrays bereit
///

/// Gibt die Schnittmenge zweier numerischer Arrays aus,
/// es wird angenommen, dass sie schon sortiert sind
export function intersect(a, b) {
	let ai = 0;
	let bi = 0;
	const ret = [];

	while ((ai < a.length) && (bi < b.length)) {
		if (a[ai] < b[bi])
			ai++;
		else if (a[ai] > b[bi])
			bi++;
		else {
			ret.push(a[ai]);
			ai++;
			bi++;
		}
	}

	return ret;
}

/// gibt die Elemente zurück, die in a, aber nicht in b sind.
export function except(a, b) {
	return a.filter((el) => b.indexOf(el) === -1);
}

/// Erzeugt ein Range-Array
export function range(min, max) {
	// Potentiell Reihenfolge tauschen
	if (min > max) [max, min] = [min, max];

	const N = max - min + 1;
	return Array.from(new Array(N), (_, index) => index + min);
}

// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
export function firstOrDefault(arr, filter) {
	for (let i = 0; i < arr.length; i++) {
		if (filter(arr[i])) return arr[i];
	}
	return null;
}