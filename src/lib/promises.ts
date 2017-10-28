///
/// Stellt einen Promise-Wrapper für asynchrone Node-Funktionen zur Verfügung
///

export type PromiseCallback = (value: any) => {} | PromiseLike<any>;

export function promisify<T>(fn, context?: any): (...args: any[]) => Promise<T>;
export function promisify(fn, context?: any) {
	return function(...args) {
		context = context || this;
		return new Promise((resolve, reject) => {
			fn.apply(context, [...args, (error, result) => {
				if (error) {
					return reject(error);
				} else {
					return resolve(result);
				}
			}]);
		});
	};
}

export function promisifyNoError<T>(fn, context?: any): (...args: any[]) => Promise<T>;
export function promisifyNoError(fn, context?: any) {
	return function(...args) {
		context = context || this;
		return new Promise((resolve) => {
			fn.apply(context, [...args, (result) => {
				return resolve(result);
			}]);
		});
	};
}

export function waterfall(...fn: PromiseCallback[]): Promise<any> {
	// Führt eine Reihe von Promises sequentiell aus
	// TODO: Rückgabewerte prüfen (ob da was zu viel ist)
	return fn.reduce(
		(prev, cur) => prev.then(cur),
		Promise.resolve(),
	);
}

/** Creates a promise that waits for the specified time and then resolves */
export function wait(ms: number): Promise<void> {
	return new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});
}
