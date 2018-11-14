export type Predicate<T> = (value: T) => boolean;
export type KeyValuePair<T> = [string, T];

// Gräbt in einem Objekt nach dem Property-Pfad.
// Bsps: (obj, "common.asdf.qwer") => obj.common.asdf.qwer
export function dig<T = any>(object: Record<string, T>, path: string): unknown {
	function _dig<T2 = any>(obj: Record<string, T2>, pathArr: string[]): unknown {
		// are we there yet? then return obj
		if (!pathArr.length) return obj;
		// go deeper
		let propName: string | number = pathArr.shift()!;
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		return _dig(obj[propName], pathArr);
	}
	return _dig(object, path.split("."));
}

// Vergräbt eine Eigenschaft in einem Objekt (Gegenteil von dig)
export function bury<T = any>(object: Record<string, T>, path: string, value: any): void {
	function _bury(obj: Record<string, any>, pathArr: string[]) {
		// are we there yet? then return obj
		if (pathArr.length === 1) {
			obj[pathArr[0]] = value;
			return;
		}
		// go deeper
		let propName: string | number = pathArr.shift()!;
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		_bury(obj[propName], pathArr);
	}
	_bury(object, path.split("."));
}
