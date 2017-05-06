"use strict";
// Babel polyfill

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// Eigene Module laden

//import { promisify, waterfall } from "./lib/promises";

// import { getEnumValueAsName } from "./lib/enums";


// Datentypen laden


// Adapter-Utils laden


// Konvertierungsfunktionen


require("babel-polyfill");

var _global = require("./lib/global");

var _global2 = _interopRequireDefault(_global);

var _str2regex = require("./lib/str2regex");

var _objectPolyfill = require("./lib/object-polyfill");

var _arrayExtensions = require("./lib/array-extensions");

var _coapClient = require("./lib/coapClient");

var _coapClient2 = _interopRequireDefault(_coapClient);

var _endpoints = require("./ipso/endpoints");

var _endpoints2 = _interopRequireDefault(_endpoints);

var _accessory = require("./ipso/accessory");

var _accessory2 = _interopRequireDefault(_accessory);

var _accessoryTypes = require("./ipso/accessoryTypes");

var _accessoryTypes2 = _interopRequireDefault(_accessoryTypes);

var _utils = require("./lib/utils");

var _utils2 = _interopRequireDefault(_utils);

var _conversions = require("./lib/conversions");

var _conversions2 = _interopRequireDefault(_conversions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var customSubscriptions = {}; // wird unten intialisiert
// dictionary of COAP observers
var observers = {};
// dictionary of known devices
var devices = {};
// dictionary of ioBroker objects
var objects = {};

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

		// TODO: load known devices from ioBroker into <devices> & <objects>
		observeDevices();
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
		_global2.default.log(`{{blue}} object with id ${id} updated`);
		if (id.startsWith(adapter.namespace)) {
			// this is our own object, remember it!
			objects[id] = obj;
		}
	},

	stateChange: function stateChange(id, state) {
		_global2.default.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`);
		if (!state.ack && id.startsWith(adapter.namespace)) {
			// our own state was changed from within ioBroker, react to it

			var stateObj = objects[id];
			if (!(stateObj && stateObj.native && stateObj.native.path)) return;

			// get "official" value for the parent object
			var devId = getAccessoryId(id);
			if (devId) {
				// get the ioBroker object
				var dev = objects[devId];
				//// read the instanceId and get a reference value
				var accessory = devices[dev.native.instanceId];

				// for now: handle changes on a case by case basis
				// everything else is too complicated for now
				var val = state.val;
				if (_global2.default.isdef(stateObj.common.min)) val = Math.max(stateObj.common.min, val);
				if (_global2.default.isdef(stateObj.common.max)) val = Math.min(stateObj.common.max, val);

				// TODO: find a way to construct these from existing accessory objects
				var payload = null;
				if (id.endsWith(".lightbulb.state")) {
					payload = { "3311": [{ "5850": val ? 1 : 0 }] };
				} else if (id.endsWith(".lightbulb.brightness")) {
					payload = { "3311": [{ "5851": val, "5712": 5 }] };
				} else if (id.endsWith(".lightbulb.color")) {
					var colorX = _conversions2.default.color("out", state.val);
					payload = { "3311": [{ "5709": colorX, "5710": 27000, "5712": 5 }] };
				} //else if (id.endsWith(".lightbulb.colorX")) {
				//	const colorY = accessory.lightList[0].colorY;
				//	payload = { "3311": [{ "5709": val, "5710": colorY, "5712": 5 }] };
				//} else if (id.endsWith(".lightbulb.colorY")) {
				//	const colorX = accessory.lightList[0].colorX;
				//	payload = { "3311": [{ "5709": colorX, "5710": val, "5712": 5 }] };
				//}

				_global2.default.log("sending payload: " + JSON.stringify(payload));

				var send = new _coapClient2.default(`${_endpoints2.default.devices}/${dev.native.instanceId}`);
				send.request("put", payload);
			}
		}

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

		// make a dummy object, we'll be filling that one later
		devices[id] = {};
		// add observer
		var obs = new _coapClient2.default(`${_endpoints2.default.devices}/${id}`, coap_getDevice_cb, id);
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
function coap_getDevice_cb(result, instanceId, _info) {
	//_.log(`got device details ${instanceId} (${JSON.stringify(_info)}): ${JSON.stringify(result)}`);
	// parse device info
	var accessory = new _accessory2.default(result);
	// remember the device object, so we can later use it as a reference for updates
	devices[instanceId] = accessory;
	//_.log(`got device details for ${instanceId}:`);
	//_.log(JSON.stringify(accessory));
	// create ioBroker device
	extendDevice(accessory);
}

function getAccessoryId(stateId) {
	var match = /^tradfri\.\d+\.[\w\-\d]+/.exec(stateId);
	if (match) return match[0];
}

function calcObjId(accessory) {
	var prefix = function () {
		switch (accessory.type) {
			case _accessoryTypes2.default.remote:
				return "RC";
			case _accessoryTypes2.default.lightbulb:
				return "L";
			default:
				_global2.default.log("unknown accessory type " + accessory.type);
				return "XYZ";
		}
	}();
	return `${adapter.namespace}.${prefix}-${accessory.instanceId}`;
}

// finds the property value for <accessory> as defined in <propPath>
function readPropertyValue(accessory, propPath) {
	// if path starts with "__convert:", use a custom conversion function
	if (propPath.startsWith("__convert:")) {
		var pathParts = propPath.substr("__convert:".length).split(",");
		try {
			var fnName = pathParts[0];
			var path = pathParts[1];
			// find initial value on the object
			var value = (0, _objectPolyfill.dig)(accessory, path);
			// and convert it
			return _conversions2.default[fnName]("in", value);
		} catch (e) {
			_global2.default.log("invalid path definition ${propPath}");
		}
	} else {
		return (0, _objectPolyfill.dig)(accessory, propPath);
	}
}

// creates or edits an existing <device>-object for an accessory
function extendDevice(accessory) {
	var objId = calcObjId(accessory);

	if (_global2.default.isdef(objects[objId])) {
		// check if we need to edit the existing object
		var devObj = objects[objId];
		var changed = false;
		// update common part if neccessary
		var newCommon = {
			name: accessory.name
		};
		if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
			devObj.common = newCommon;
			changed = true;
		}
		var newNative = {
			instanceId: accessory.instanceId,
			manufacturer: accessory.deviceInfo.manufacturer,
			firmwareVersion: accessory.deviceInfo.firmwareVersion
		};
		// update native part if neccessary
		if (JSON.stringify(devObj.native) !== JSON.stringify(newNative)) {
			devObj.native = newNative;
			changed = true;
		}
		if (changed) adapter.extendObject(objId, devObj);

		// ====

		// from here we can update the states
		// filter out the ones belonging to this device with a property path
		var stateObjs = (0, _objectPolyfill.filter)(objects, function (obj) {
			return obj._id.startsWith(objId) && obj.native && obj.native.path;
		});
		// for each property try to update the value
		var _iteratorNormalCompletion3 = true;
		var _didIteratorError3 = false;
		var _iteratorError3 = undefined;

		try {
			for (var _iterator3 = (0, _objectPolyfill.entries)(stateObjs)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
				var _ref = _step3.value;

				var _ref2 = _slicedToArray(_ref, 2);

				var id = _ref2[0];
				var obj = _ref2[1];

				try {
					// Object could have a default value, find it
					var newValue = readPropertyValue(accessory, obj.native.path);
					if (obj.common.type === "boolean") {
						// fix bool values
						newValue = newValue === 1 || newValue === "true" || newValue === "on";
					}
					adapter.setState(id, newValue, true);
				} catch (e) {/* skip this value */}
			}
		} catch (err) {
			_didIteratorError3 = true;
			_iteratorError3 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion3 && _iterator3.return) {
					_iterator3.return();
				}
			} finally {
				if (_didIteratorError3) {
					throw _iteratorError3;
				}
			}
		}
	} else {
		// create new object
		var _devObj = {
			_id: objId,
			type: "device",
			common: {
				name: accessory.name
			},
			native: {
				instanceId: accessory.instanceId,
				manufacturer: accessory.deviceInfo.manufacturer,
				firmwareVersion: accessory.deviceInfo.firmwareVersion
			}
		};
		adapter.setObject(objId, _devObj);

		// also create state objects, depending on the accessory type
		var _stateObjs = {
			alive: { // alive state
				_id: `${objId}.alive`,
				type: "state",
				common: {
					name: "device alive",
					read: true,
					write: false,
					type: "boolean",
					role: "indicator.alive",
					desc: "indicates if the device is currently alive and connected to the gateway"
				},
				native: {
					path: "alive"
				}
			},
			lastSeen: { // last seen state
				_id: `${objId}.lastSeen`,
				type: "state",
				common: {
					name: "last seen timestamp",
					read: true,
					write: false,
					type: "number",
					role: "indicator.lastSeen",
					desc: "indicates when the device has last been seen by the gateway"
				},
				native: {
					path: "lastSeen"
				}
			}
		};

		if (accessory.type === _accessoryTypes2.default.lightbulb) {
			//stateObjs["lightbulb.color"] = {
			//	_id: `${objId}.lightbulb.color`,
			//	type: "state",
			//	common: {
			//		name: "RGB color",
			//		read: true, // TODO: check
			//		write: false, // TODO: check
			//		type: "string",
			//		role: "level.color.rgb",
			//		desc: "hex representation of the lightbulb color"
			//	},
			//	native: {
			//		path: "lightList.[0].color"
			//	}
			//};
			_stateObjs["lightbulb.color"] = {
				_id: `${objId}.lightbulb.color`,
				type: "state",
				common: {
					name: "color temperature of the lightbulb",
					read: true, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 100,
					unit: "%",
					type: "number",
					role: "level.color.temperature",
					desc: "range: 0% = cold, 100% = warm"
				},
				native: {
					path: "__convert:color,lightList.[0].colorX"
				}
			};
			//stateObjs["lightbulb.colorX"] = {
			//	_id: `${objId}.lightbulb.colorX`,
			//	type: "state",
			//	common: {
			//		name: "CIE 1931 x coordinate",
			//		read: true, // TODO: check
			//		write: true, // TODO: check
			//		min: 24930,
			//		max: 33135,
			//		type: "number",
			//		role: "level.color.temperature",
			//		desc: "x coordinate of the color temperature in the CIE 1931 color space"
			//	},
			//	native: {
			//		path: "lightList.[0].colorX"
			//	}
			//};
			//stateObjs["lightbulb.colorY"] = {
			//	_id: `${objId}.lightbulb.colorY`,
			//	type: "state",
			//	common: {
			//		name: "CIE 1931 y coordinate",
			//		read: true, // TODO: check
			//		write: true, // TODO: check
			//		min: 24694,
			//		max: 27211,
			//		type: "number",
			//		role: "level.color.temperature",
			//		desc: "y coordinate of the color temperature in the CIE 1931 color space"
			//	},
			//	native: {
			//		path: "lightList.[0].colorY"
			//	}
			//};
			_stateObjs["lightbulb.brightness"] = {
				_id: `${objId}.lightbulb.brightness`,
				type: "state",
				common: {
					name: "brightness",
					read: true, // TODO: check
					write: true, // TODO: check
					min: 0,
					max: 254,
					type: "number",
					role: "level",
					desc: "brightness of the lightbulb"
				},
				native: {
					path: "lightList.[0].dimmer"
				}
			};
			_stateObjs["lightbulb.state"] = {
				_id: `${objId}.lightbulb.state`,
				type: "state",
				common: {
					name: "on/off",
					read: true, // TODO: check
					write: true, // TODO: check
					type: "boolean",
					role: "switch"
				},
				native: {
					path: "lightList.[0].onOff"
				}
			};
		}

		var createObjects = Object.keys(_stateObjs).map(function (key) {
			var stateId = `${objId}.${key}`;
			var obj = _stateObjs[key];
			var initialValue = null;
			if (_global2.default.isdef(obj.native.path)) {
				// Object could have a default value, find it
				initialValue = readPropertyValue(accessory, obj.native.path);
				if (obj.common.type === "boolean") {
					// fix bool values
					initialValue = initialValue === 1 || initialValue === "true" || initialValue === "on";
				}
			}
			// create object and return the promise, so we can wait
			return adapter.$createOwnStateEx(stateId, obj, initialValue);
		});
		Promise.all(createObjects);
	}
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
