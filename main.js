"use strict";
// Babel polyfill

require("babel-polyfill");

var _global = require("./lib/global");

var _global2 = _interopRequireDefault(_global);

var _promises = require("./lib/promises");

var _str2regex = require("./lib/str2regex");

var _objectPolyfill = require("./lib/object-polyfill");

var _arrayExtensions = require("./lib/array-extensions");

var _coapClient = require("./lib/coapClient");

var _coapClient2 = _interopRequireDefault(_coapClient);

var _endpoints = require("./ipso/endpoints");

var _endpoints2 = _interopRequireDefault(_endpoints);

var _utils = require("./lib/utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Eigene Module laden
var customSubscriptions = {}; // wird unten intialisiert


// Adapter-Utils laden

// import { getEnumValueAsName } from "./lib/enums";
var observers = {};
// dictionary of known devices
var devices = {};

// Adapter-Objekt erstellen
var adapter = _utils2.default.adapter({
	name: "tradfri",

	// Wird aufgerufen, wenn Adapter initialisiert wird
	ready: function ready() {
		// Adapter-Instanz global machen
		_global2.default.adapter = adapter;

		// Eigene Objekte/States beobachten
		adapter.subscribeStates("*");
		adapter.subscribeObjects("*");

		// Custom subscriptions erlauben 
		_global2.default.subscribe = subscribe;
		_global2.default.unsubscribe = unsubscribe;

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

	message: function message(obj) {
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

	objectChange: function objectChange(id, obj) {
		// TODO: Pr�fen
	},

	stateChange: function stateChange(id, state) {
		// Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
		try {
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = (0, _objectPolyfill.values)(customSubscriptions.subscriptions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var sub = _step.value;

					if (sub && sub.pattern && sub.callback) {
						// Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
						if (sub.pattern.test(id)) sub.callback(id, state);
					}
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}
		} catch (e) {
			_global2.default.log("error handling custom sub: " + e);
		}
	},

	unload: function unload(callback) {
		// is called when adapter shuts down - callback has to be called under any circumstances!
		try {

			// stop all observers
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = (0, _objectPolyfill.values)(observers)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var obs = _step2.value;

					obs.stop();
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			callback();
		} catch (e) {
			callback();
		}
	}
});

// ==================================
// manage devices

function observeDevices() {
	observers.allDevices = new _coapClient2.default(_endpoints2.default.devices, coapCb_getAllDevices);
	observers.allDevices.observe();
}

// gets called whenever "get /15001" updates
function coapCb_getAllDevices(newDevices, _dummy, info) {

	_global2.default.log(`got all devices (${JSON.stringify(info)}): ${JSON.stringify(newDevices)}`);

	// get old keys as int array
	var oldKeys = Object.keys(devices).map(function (k) {
		return +k;
	}).sort();
	// get new keys as int array
	var newKeys = newDevices.sort();
	// translate that into added and removed devices
	var addedKeys = (0, _arrayExtensions.except)(newKeys, oldKeys);
	_global2.default.log(`adding devices with keys ${JSON.stringify(addedKeys)}`);
	addedKeys.forEach(function (id) {
		var observerKey = `devices/${id}`;
		if (_global2.default.isdef(observers[observerKey])) return;

		devices[id] = {}; // what should it be?
		// add observer
		var obs = new _coapClient2.default(`${_endpoints2.default.devices}/${id}`, coapCb_getDevice, id);
		obs.observe(); // internal mutex will take care of sequencing
		observers[observerKey] = obs;
	});

	var removedKeys = (0, _arrayExtensions.except)(oldKeys, newKeys);
	_global2.default.log(`removing devices with keys ${JSON.stringify(removedKeys)}`);
	removedKeys.forEach(function (id) {
		var observerKey = `devices/${id}`;
		if (!_global2.default.isdef(observers[observerKey])) return;
		// remove device from dictionary
		delete devices[id];
		// remove observers
		observers[observerKey].stop();
		delete observers[observerKey];

		// TODO: delete ioBroker device
	});

	_global2.default.log(`active observers: ${Object.keys(observers).map(function (k) {
		return k + ": " + observers[k].endpoint;
	})}`);
}
// gets called whenever "get /15001/<instanceId>" updates
function coapCb_getDevice(result, instanceId, info) {
	_global2.default.log(`got device details ${instanceId} (${JSON.stringify(info)}): ${JSON.stringify(result)}`);
	// TODO: create ioBroker device
}

// ==================================
// Custom subscriptions
Object.assign(customSubscriptions, {
	counter: 0,
	subscriptions: {
		// "<id>" : {pattern, callback}
	}
});
function subscribe(pattern, callback) {

	try {
		if (typeof pattern === "string") {
			pattern = (0, _str2regex.str2regex)(pattern);
		} else if (pattern instanceof RegExp) {
			// so sollte es sein
		} else {
			// NOPE
			throw "must be regex or string";
		}
	} catch (e) {
		_global2.default.log("cannot subscribe with this pattern. reason: " + e);
	}

	var newCounter = ++customSubscriptions.counter;
	var id = "" + newCounter;

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
process.on('unhandledRejection', function (r) {
	adapter.log.error("unhandled promise rejection: " + r);
});
//# sourceMappingURL=maps/main.js.map
