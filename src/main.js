"use strict";
// Babel polyfill
import "babel-polyfill";

// Eigene Module laden
import _ from "./lib/global";
import { promisify, waterfall } from "./lib/promises";
import { str2regex } from "./lib/str2regex";
import { /*entries,*/ values } from "./lib/object-polyfill";
import { intersect, except } from "./lib/array-extensions";
// import { getEnumValueAsName } from "./lib/enums";
import Coap from "./lib/coapClient";
import coapEndpoints from "./ipso/endpoints";

// Adapter-Utils laden
import utils from "./lib/utils";

const customSubscriptions = {}; // wird unten intialisiert
const observers = {

};
// dictionary of known devices
const devices = {};

// Adapter-Objekt erstellen
const adapter = utils.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: function () {
		// Adapter-Instanz global machen
		_.adapter = adapter;

		// Eigene Objekte/States beobachten
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

		// Custom subscriptions erlauben 
		_.subscribe = subscribe;
		_.unsubscribe = unsubscribe;

		// TODO: load known devices from ioBroker into <devices>
		observeDevices();
		// Test code:
		//const requests = [65536, 65537]
		//	.map(id => new Coap(
		//		`${coapEndpoints.devices}/${id}`,
		//		(result, k) => {
		//			_.log(`result (${k}) = ` + JSON.stringify(result));
		//		}, id
		//	))
		//	.map(cl => cl.request())
		//	;
		//// internal mutex takes care of sequence
		//Promise.all(requests).then(() => _.log("all requests done"));
		////// run requests in serial
		////requests.reduce(
		////	(prev, cur) => prev.then(() => {
		////		_.log(`cur is ${typeof cur}`);
		////		_.log(`executing request for endpoint ${cur.endpoint}`);
		////		return cur.request();
		////	}),
		////	Promise.resolve()
		////);

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
		// TODO: Pr�fen
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
			
			// stop all observers
			for (let obs of values(observers)) {
				obs.stop();
			}
			callback();
		} catch (e) {
			callback();
		}
	},
});

// ==================================
// manage devices

function observeDevices() {
	observers.allDevices = new Coap(coapEndpoints.devices, coapCb_getAllDevices);
	observers.allDevices.observe();
}

// gets called whenever "get /15001" updates
function coapCb_getAllDevices(newDevices, _dummy, info) {

	_.log(`got all devices (${JSON.stringify(info)}): ${JSON.stringify(newDevices)}`);

	// get old keys as int array
	const oldKeys = Object.keys(devices).map(k => +k).sort();
	// get new keys as int array
	const newKeys = newDevices.sort();
	// translate that into added and removed devices
	const addedKeys = except(newKeys, oldKeys);
	_.log(`adding devices with keys ${JSON.stringify(addedKeys)}`);
	addedKeys.forEach(id => {
		const observerKey = `devices/${id}`;
		if (_.isdef(observers[observerKey])) return;

		devices[id] = {}; // what should it be?
		// add observer
		const obs = new Coap(
			`${coapEndpoints.devices}/${id}`,
			coapCb_getDevice,
			id
		);
		obs.observe(); // internal mutex will take care of sequencing
		observers[observerKey] = obs;
	});


	const removedKeys = except(oldKeys, newKeys);
	_.log(`removing devices with keys ${JSON.stringify(removedKeys)}`);
	removedKeys.forEach(id => {
		const observerKey = `devices/${id}`;
		if (!_.isdef(observers[observerKey])) return;
		// remove device from dictionary
		delete devices[id];
		// remove observers
		observers[observerKey].stop();
		delete observers[observerKey];

		// TODO: delete ioBroker device
	});

	_.log(`active observers: ${Object.keys(observers).map(k => k + ": " + observers[k].endpoint)}`);
}
// gets called whenever "get /15001/<instanceId>" updates
function coapCb_getDevice(result, instanceId, info) {
	_.log(`got device details ${instanceId} (${JSON.stringify(info)}): ${JSON.stringify(result)}`);
	// TODO: create ioBroker device
}

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
