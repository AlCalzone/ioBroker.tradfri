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

// Gräbt in einem Objekt nach dem Property-Pfad. 
// Bsps: (obj, "common.asdf.qwer") => obj.common.asdf.qwer
export function dig(object, path) {
	function _dig(obj, pathArr) {
		// are we there yet? then return obj
		if (!pathArr.length) return obj;
		// go deeper
		let propName = pathArr.shift();
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1,-1);
		}
		return _dig(obj[propName], pathArr);
	}
	return _dig(object, path.split("."));
}

// Vergräbt eine Eigenschaft in einem Objekt (Gegenteil von dig)
export function bury(object, path, value) {
	function _bury(obj, pathArr, value) {
		// are we there yet? then return obj
		if (pathArr.length === 1) {
			obj[pathArr] = value;
			return;
		}
		// go deeper
		let propName = pathArr.shift();
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		_bury(obj[propName], pathArr, value);
	}
	_bury(object, path.split("."), value);
}


// Kopiert Eigenschaften rekursiv von einem Objekt auf ein anderes
export function extend(target, source) {
	target = target || {};
	for (let [prop, val] of entries(source)) {
		if (val instanceof Object) {
			target[prop] = extend(target[prop], val);
		} else {
			target[prop] = val;
		}
	}
	return target;
}
