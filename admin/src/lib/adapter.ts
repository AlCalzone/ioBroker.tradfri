// fix missing property errors/warnings
interface SendToResult {
	error?: string | Error;
	result?: any;
}

// tslint:disable-next-line:class-name
interface ioBrokerSocket {
	emit(command: "subscribeObjects", pattern: string): void;

	on(event: "objectChange", handler: ioBroker.ObjectChangeHandler): void;
	// TODO: other events
}

export const $window = window as any as {
	load: (settings: ioBroker.AdapterConfig, onChange: (hasChanges: boolean) => void) => void;
	save: (callback: (settings: ioBroker.AdapterConfig) => void) => void;
	readonly instance: number;
	/** Translates text */
	_: (text: string) => string;
	jQuery: JQueryStatic;
	$: JQueryStatic;
	socket: ioBrokerSocket;
	sendTo: (instance: any | null, command: string, message: any, callback: (result: SendToResult) => void) => void;
};
// export interface JQueryUI {
// 	tabs: (selector?: any) => JQuery & JQueryUI;
// 	button: (selector?: any) => JQuery & JQueryUI;
// 	multiselect: (selector?: any) => JQuery & JQueryUI;
// }
// export const $$ = $window.jQuery as any as (...args: any[]) => JQuery /* & JQueryUI */;
export const instance = $window.instance || 0;
export const _ = $window._ || ((text: string) => text);
export const socket = $window.socket;
export const sendTo = $window.sendTo;
