// fix missing property errors/warnings
export const $window = window as any as {
	load: (settings, onChange) => void;
	save: (callback: (settings) => void) => void;
	readonly instance: number;
	/** Translates text */
	_: (text: string) => string;
	jQuery: JQueryStatic;
};
export interface JQueryWithTabs {
	tabs: (selector?: any) => JQuery & JQueryWithTabs;
}
export const $$ = $window.jQuery as any as (...args: any[]) => JQuery & JQueryWithTabs;
export const instance = $window.instance;
export const _ = $window._;
