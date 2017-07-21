"use strict";

import { filter as objFilter, entries } from "./object-polyfill";
import { promisify } from "./promises";

// ==================================

const colors = {
	"red": "#db3340",
	"yellow": "#ffa200",
	"green": "#5bb12f",
	"blue": "#0087cb",
};


const replacements = {
	bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
	italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
	underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
	strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
	color: [/\{{2}(\w+)\|(.*?)\}{2}/, (str, p1, p2) => {
		const color = colors[p1];
		if (!color) return str;

		return `<span style="color: ${color}">${p2}</span>`;
	}],
	fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, (str, p1, p2) => {
		const color = colors[p1];
		if (!color) return str;

		return `<span style="color: ${color}">${p2}</span>`;
	}],
};


// Singleton-Pattern
let __instance = null;

const
	_adapter = Symbol("_adapter"),
	_loglevel = Symbol("_loglevel")
	;
class Global {

	constructor() {
		if (__instance) {
			return __instance;
		}
		__instance = this;

		this.loglevels = { "off": 0, "on": 1, "debug": 2 };
		this.severity = { "normal": 0, "warn": 1, "error": 2 };
		this[_loglevel] = this.loglevels.on;

	}

	get adapter() { return this[_adapter]; }
	set adapter(adapter) {
		this[_adapter] = adapter;

		// Eine Handvoll Funktionen promisifizieren
		adapter.objects.$getObjectList = promisify(adapter.objects.getObjectList, adapter.objects);
		adapter.$getForeignObject = promisify(adapter.getForeignObject, adapter);
		adapter.$setForeignObject = promisify(adapter.setForeignObject, adapter);
		adapter.$getForeignObjects = promisify(adapter.getForeignObjects, adapter);
		adapter.$getForeignState = promisify(adapter.getForeignState, adapter);
		adapter.$setForeignState = promisify(adapter.setForeignState, adapter);
		adapter.$getObject = promisify(adapter.getObject, adapter);
		adapter.$setObject = promisify(adapter.setObject, adapter);
		adapter.$getState = promisify(adapter.getState, adapter);
		adapter.$setState = promisify(adapter.setState, adapter);

		adapter.$createOwnState = async function (id, initialValue, ack = true, type = "state", commonType = "mixed") {
			await adapter.$setObject(id, {
				common: {
					name: id,
					role: "value",
					type: commonType
				},
				native: {},
				type: type
			});
			if (initialValue != undefined)
				await adapter.$setState(id, initialValue, ack);
		};
		adapter.$createOwnStateEx = async function (id, obj, initialValue, ack = true) {
			await adapter.$setObject(id, obj);
			if (initialValue != undefined)
				await adapter.$setState(id, initialValue, ack);
		};
	}

	get loglevel() { return this[_loglevel]; }
	set loglevel(value) { this[_loglevel] = value; }

	/*
		Formatierungen:
		**fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
		schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
	*/
	log(message, {level = this.loglevels.on, severity = this.severity.normal} = {}) {
		if (level < this[_loglevel]) return;
		if (!this[_adapter]) return;

		// Warnstufe auswählen
		let logFn;
		switch (severity) {
			case this.severity.warn:
				logFn = "warn";
				break;
			case this.severity.error:
				logFn = "error";
				break;
			case this.severity.normal:
			default:
				logFn = "info";
		}
		// Debug überschreibt severity
		if (level === this.loglevels.debug) logFn = "debug";

		if (message) {
			// Farben und Formatierungen
			for (let [/*key*/, [regex, repl]] of entries(replacements)) {
				message = message.replace(regex, repl);
			}
		}

		this[_adapter].log[logFn](message);
	}

	// Kurzschreibweise für ein Objekt
	async $(id) {
		return await this[_adapter].$getForeignObject(id);
	}

	// Kurzschreibweise für mehrere Objekte
	async $$(pattern, type, role) {
		const objects = await this[_adapter].$getForeignObjects(pattern, type);
		if (role) {
			return objFilter(objects, o => o.common.role === role);
		}
		else {
			return objects;
		}
	}

	// Prüfen auf (un)defined
	isdef(value) { return value != undefined; }

}

// ==================================

const stuff = new Global();
export default stuff;