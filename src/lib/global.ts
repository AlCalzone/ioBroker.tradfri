import { filter as objFilter } from "alcalzone-shared/objects";

// ==================================

// Disabled for now since there's no more html support in ioBroker
// const colors = {
// 	red: "#db3340",
// 	yellow: "#ffa200",
// 	green: "#5bb12f",
// 	blue: "#0087cb",
// };

// const replacements: {
// 	[id: string]: [RegExp, string | ((substring: string, ...args: any[]) => string)];
// } = {
// 	bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
// 	italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
// 	underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
// 	strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
// 	color: [/\{{2}(\w+)\|(.*?)\}{2}/, (str, p1, p2) => {
// 		const color = colors[p1];
// 		if (!color) return str;

// 		return `<span style="color: ${color}">${p2}</span>`;
// 	}],
// 	fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, (str, p1, p2) => {
// 		const color = colors[p1];
// 		if (!color) return str;

// 		return `<span style="color: ${color}">${p2}</span>`;
// 	}],
// };

export interface ExtendedAdapter extends ioBroker.Adapter {
	__isExtended: boolean;

	createOwnStateAsync(id: string, initialValue: any, ack?: boolean, commonType?: ioBroker.CommonType): Promise<void>;
	createOwnStateExAsync(id: string, obj: ioBroker.Object, initialValue: any, ack?: boolean): Promise<void>;

}

export class Global {

	private static _adapter: ExtendedAdapter;
	public static get adapter(): ExtendedAdapter { return Global._adapter; }
	public static set adapter(adapter: ExtendedAdapter) {
		Global._adapter = adapter;
	}

	public static extend(adapter: ioBroker.Adapter): ExtendedAdapter {
		// Eine Handvoll Funktionen promisifizieren

		const ret = adapter as ExtendedAdapter;
		ret.createOwnStateAsync = async (id: string, initialValue: any, ack: boolean = true, commonType: ioBroker.CommonType = "mixed") => {
			await ret.setObjectAsync(id, {
				type: "state",
				common: {
					name: id,
					role: "value",
					type: commonType,
					read: true,
					write: true,
				},
				native: {},
			});
			if (initialValue != undefined) await ret.setStateAsync(id, initialValue, ack);
		};
		ret.createOwnStateExAsync = async (id: string, obj: ioBroker.Object, initialValue: any, ack = true) => {
			await ret.setObjectAsync(id, obj);
			if (initialValue != undefined) await ret.setStateAsync(id, initialValue, ack);
		};

		return ret;
	}

	/*
		Formatierungen:
		**fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
		schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
	*/
	public static log(message: string, level: ioBroker.LogLevel = "info") {
		if (!Global.adapter) return;

		// if (message) {
		// 	// Farben und Formatierungen
		// 	for (const [/*key*/, [regex, repl]] of entries(replacements)) {
		// 		if (typeof repl === "string") {
		// 			message = message.replace(regex, repl);
		// 		} else { // a bit verbose, but TS doesn't get the overload thingy here
		// 			message = message.replace(regex, repl);
		// 		}
		// 	}
		// }

		if (level === "silly" && !(level in Global._adapter.log)) level = "debug";
		Global._adapter.log[level](message);
	}

	/**
	 * Kurzschreibweise für die Ermittlung eines Objekts
	 * @param id
	 */
	public static $(id: string): Promise<ioBroker.Object | null | undefined> {
		return Global._adapter.getForeignObjectAsync(id);
	}

	/**
	 * Kurzschreibweise für die Ermittlung mehrerer Objekte
	 * @param id
	 */
	public static async $$(pattern: string, type: ioBroker.ObjectType, role?: string): Promise<Record<string, ioBroker.Object>> {
		const objects = await Global._adapter.getForeignObjectsAsync(pattern, type);
		if (role) {
			return objFilter(objects, o => (o.common as any).role === role);
		} else {
			return objects;
		}
	}

}
