"use strict";
// Babel polyfill

require("babel-polyfill");

var _global = require("./lib/global");

var _global2 = _interopRequireDefault(_global);

var _promises = require("./lib/promises");

var _str2regex = require("./lib/str2regex");

var _objectPolyfill = require("./lib/object-polyfill");

var _coapClient = require("./lib/coapClient");

var _coapClient2 = _interopRequireDefault(_coapClient);

var _utils = require("./lib/utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import { getEnumValueAsName } from "./lib/enums";


// Eigene Module laden
var customSubscriptions = {}; // wird unten intialisiert
// dictionary of known devices


// Adapter-Utils laden
var devices = {};
var obs = void 0;

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
			//adapter.log.info('cleaned everything up...');
			obs.end();
			callback();
		} catch (e) {
			callback();
		}
	}
});

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
