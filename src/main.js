"use strict";
// Babel polyfill
import "babel-polyfill";

// Eigene Module laden
import _ from "./lib/global";
import { promisify } from "./lib/promises";
//import deferred from "./lib/defer-promise";
import { /*entries,*/ values } from "./lib/object-polyfill";
import { getEnumValueAsName } from "./lib/enums";
// Adapter-Utils laden
import utils from "./lib/utils";

const customSubscriptions = {}; // wird unten intialisiert

// Adapter-Objekt erstellen
const adapter = utils.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: async function () {
		// Adapter-Instanz global machen
		_.adapter = adapter;

		// Eigene Objekte/States beobachten
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

		// Custom subscriptions erlauben 
		_.subscribe = subscribe;
		_.unsubscribe = unsubscribe;

	},

	message: (obj) => {
		// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
		if (typeof obj == 'object' && obj.message) {
			if (obj.command == 'send') {
				// e.g. send email or pushover or whatever
				//console.log('send command');

				// Send response in callback if required
				if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
			}
		}
	},

	objectChange: (id, obj) => {
		// TODO: Prüfen
	},

	stateChange: (id, state) => {
		// Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
		try {
			for (let sub of values(customSubscriptions.subscriptions)) {
				if (sub && sub.pattern && sub.callback) {
					// Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
					if (sub.pattern.test(id))
						sub.callback(id, state);
				}
			}
		} catch (e) {
			_.log("error handling custom sub: " + e);
		}
	},

	unload: (callback) => {
		// is called when adapter shuts down - callback has to be called under any circumstances!
		try {
			//adapter.log.info('cleaned everything up...');
			callback();
		} catch (e) {
			callback();
		}
	},
});

// ==================================
// Custom subscriptions
Object.assign(customSubscriptions, {
	counter: 0,
	subscriptions: {
		// "<id>" : {pattern, callback}
	},
});
function subscribe(pattern, callback) {

	try {
		if (typeof pattern === "string") {
			pattern = str2regex(pattern);
		} else if (pattern instanceof RegExp) {
			// so sollte es sein
		} else {
			// NOPE
			throw "must be regex or string";
		}
	} catch (e) {
		_.log("cannot subscribe with this pattern. reason: " + e);
	}

	const newCounter = (++customSubscriptions.counter);
	const id = "" + newCounter;

	customSubscriptions.subscriptions[id] = { pattern, callback };

	//_.log(`added subscription for pattern ${pattern}. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);

	return id;
}
function unsubscribe(id) {
	//_.log(`unsubscribing subscription #${id}...`);
	if (customSubscriptions.subscriptions[id]) {
		//const pattern = customSubscriptions.subscriptions[id].pattern;
		delete customSubscriptions.subscriptions[id];
		//_.log(`unsubscribe ${pattern}: success. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
	} else {
		//_.log(`unsubscribe: subscription not found`);
	}
}

// Unbehandelte Fehler tracen
process.on('unhandledRejection', r => {
	adapter.log.error("unhandled promise rejection: " + r);
});
