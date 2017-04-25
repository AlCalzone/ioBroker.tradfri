"use strict";
///
/// Stellt einen Polyfill für Object.entries bereit
///
export function* entries(obj) {
	for (let key of Object.keys(obj)) {
		yield [key, obj[key]];
	}
}
//export function entries(obj) {
//	return Object.keys(obj)
//		.map(key => [key, obj[key]])
//		;
//	//for (let key of Object.keys(obj)) {
//	//	yield [key, obj[key]];
//	//}
//}

///
/// Stellt einen Polyfill für Object.values bereit
///
export function* values(obj) {
	for (let key of Object.keys(obj)) {
		yield obj[key];
	}
}
//export function values(obj) {
//	return Object.keys(obj)
//		.map(key => obj[key])
//		;
//}


export function filter(obj, predicate) {
	const ret = {};
	for (let [key, val] of entries(obj)) {
		if (predicate(val)) ret[key] = val;
	}
	return ret;
}

// Kombinierte mehrere Key-Value-Paare zu einem Objekt
export function composeObject(properties) {
	return properties.reduce((acc, [key, value]) => {
		acc[key] = value;
		return acc;
	}, {});
}