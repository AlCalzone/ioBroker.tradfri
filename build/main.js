// tslint:disable:object-literal-key-quotes
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
// Reflect-polyfill laden
require("reflect-metadata");
// Eigene Module laden
var node_coap_client_1 = require("node-coap-client");
var endpoints_1 = require("./ipso/endpoints");
var array_extensions_1 = require("./lib/array-extensions");
var global_1 = require("./lib/global");
var object_polyfill_1 = require("./lib/object-polyfill");
var str2regex_1 = require("./lib/str2regex");
// Datentypen laden
var accessory_1 = require("./ipso/accessory");
// Adapter-Utils laden
var utils_1 = require("./lib/utils");
// Konvertierungsfunktionen
var conversions_1 = require("./lib/conversions");
var customStateSubscriptions = {
    subscriptions: {},
    counter: 0,
};
var customObjectSubscriptions = {
    subscriptions: {},
    counter: 0,
};
// dictionary of COAP observers
var observers = [];
// dictionary of known devices
var devices = {};
// dictionary of ioBroker objects
var objects = {};
// the base of all requests
var requestBase;
// Adapter-Objekt erstellen
var adapter = utils_1.default.adapter({
    name: "tradfri",
    // Wird aufgerufen, wenn Adapter initialisiert wird
    ready: function () {
        // Sicherstellen, dass die Optionen vollst�ndig ausgef�llt sind.
        if (adapter.config
            && adapter.config.host != null && adapter.config.host !== ""
            && adapter.config.securityCode != null && adapter.config.securityCode !== "") {
            // alles gut
        }
        else {
            adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
            return;
        }
        // Adapter-Instanz global machen
        adapter = global_1.Global.extend(adapter);
        global_1.Global.adapter = adapter;
        // redirect console output
        // console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
        // console.error = (msg) => adapter.log.error("STDERR > " + msg);
        global_1.Global.log("startfile = " + process.argv[1]);
        // Eigene Objekte/States beobachten
        adapter.subscribeStates("*");
        adapter.subscribeObjects("*");
        // Custom subscriptions erlauben
        global_1.Global.subscribeStates = subscribeStates;
        global_1.Global.unsubscribeStates = unsubscribeStates;
        global_1.Global.subscribeObjects = subscribeObjects;
        global_1.Global.unsubscribeObjects = unsubscribeObjects;
        // initialize CoAP client
        var hostname = adapter.config.host.toLowerCase();
        node_coap_client_1.CoapClient.setSecurityParams(hostname, {
            psk: { "Client_identity": adapter.config.securityCode },
        });
        requestBase = "coaps://" + hostname + ":5684/";
        // TODO: load known devices from ioBroker into <devices> & <objects>
        observeDevices();
    },
    message: function (obj) {
        // Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
        if (typeof obj === "object" && obj.message) {
            if (obj.command === "send") {
                // e.g. send email or pushover or whatever
                // console.log('send command');
                // Send response in callback if required
                if (obj.callback)
                    adapter.sendTo(obj.from, obj.command, "Message received", obj.callback);
            }
        }
    },
    objectChange: function (id, obj) {
        global_1.Global.log("{{blue}} object with id " + id + " updated", { level: global_1.Global.loglevels.ridiculous });
        if (id.startsWith(adapter.namespace)) {
            // this is our own object, remember it!
            objects[id] = obj;
        }
        // Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
        try {
            for (var _i = 0, _a = object_polyfill_1.values(customObjectSubscriptions.subscriptions); _i < _a.length; _i++) {
                var sub = _a[_i];
                if (sub && sub.pattern && sub.callback) {
                    // Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
                    if (sub.pattern.test(id))
                        sub.callback(id, obj);
                }
            }
        }
        catch (e) {
            global_1.Global.log("error handling custom sub: " + e);
        }
    },
    stateChange: function (id, state) { return __awaiter(_this, void 0, void 0, function () {
        var stateObj, devId, dev, accessory, val, newAccessory, light, colorX, serializedObj, payload, _i, _a, sub;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    global_1.Global.log("{{blue}} state with id " + id + " updated: ack=" + state.ack + "; val=" + state.val, { level: global_1.Global.loglevels.ridiculous });
                    if (!(!state.ack && id.startsWith(adapter.namespace))) return [3 /*break*/, 3];
                    stateObj = objects[id];
                    if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
                        return [2 /*return*/];
                    devId = getAccessoryId(id);
                    if (!devId) return [3 /*break*/, 3];
                    dev = objects[devId];
                    accessory = devices[dev.native.instanceId];
                    val = state.val;
                    // make sure we have whole numbers
                    if (stateObj.common.type === "number") {
                        val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
                        if (global_1.Global.isdef(stateObj.common.min))
                            val = Math.max(stateObj.common.min, val);
                        if (global_1.Global.isdef(stateObj.common.max))
                            val = Math.min(stateObj.common.max, val);
                    }
                    newAccessory = accessory.clone();
                    if (id.indexOf(".lightbulb.") > -1) {
                        light = newAccessory.lightList[0];
                        if (id.endsWith(".state")) {
                            light.merge({ onOff: val });
                        }
                        else if (id.endsWith(".brightness")) {
                            light.merge({
                                dimmer: val,
                                transitionTime: 5 // TODO: <- make this configurable
                            });
                        }
                        else if (id.endsWith(".color")) {
                            colorX = conversions_1.default.color("out", state.val);
                            light.merge({
                                colorX: colorX,
                                colorY: 27000,
                                transitionTime: 5 // TODO: <- make this configurable
                            });
                        }
                    }
                    serializedObj = newAccessory.serialize(accessory);
                    if (!(!serializedObj || Object.keys(serializedObj).length === 0)) return [3 /*break*/, 2];
                    global_1.Global.log("empty object, not sending any payload", { level: global_1.Global.loglevels.ridiculous });
                    return [4 /*yield*/, adapter.$setState(id, state.val, true)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    payload = JSON.stringify(serializedObj);
                    global_1.Global.log("sending payload: " + payload, { level: global_1.Global.loglevels.ridiculous });
                    payload = Buffer.from(payload);
                    node_coap_client_1.CoapClient.request("" + requestBase + endpoints_1.default.devices + "/" + dev.native.instanceId, "put", payload);
                    _b.label = 3;
                case 3:
                    // Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
                    try {
                        for (_i = 0, _a = object_polyfill_1.values(customStateSubscriptions.subscriptions); _i < _a.length; _i++) {
                            sub = _a[_i];
                            if (sub && sub.pattern && sub.callback) {
                                // Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
                                if (sub.pattern.test(id))
                                    sub.callback(id, state);
                            }
                        }
                    }
                    catch (e) {
                        global_1.Global.log("error handling custom sub: " + e);
                    }
                    return [2 /*return*/];
            }
        });
    }); },
    unload: function (callback) {
        // is called when adapter shuts down - callback has to be called under any circumstances!
        try {
            // stop all observers
            for (var _i = 0, observers_1 = observers; _i < observers_1.length; _i++) {
                var url = observers_1[_i];
                node_coap_client_1.CoapClient.stopObserving(url);
            }
            callback();
        }
        catch (e) {
            callback();
        }
    },
});
// ==================================
// manage devices
function observeDevices() {
    var allDevicesUrl = "" + requestBase + endpoints_1.default.devices;
    if (observers.indexOf(allDevicesUrl) === -1) {
        observers.push(allDevicesUrl);
        node_coap_client_1.CoapClient.observe(allDevicesUrl, "get", coapCb_getAllDevices);
    }
}
// gets called whenever "get /15001" updates
function coapCb_getAllDevices(response) {
    if (response.code.toString() !== "2.05") {
        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getAllDevices.", { severity: global_1.Global.severity.error });
        return;
    }
    var newDevices = parsePayload(response);
    global_1.Global.log("got all devices: " + JSON.stringify(newDevices));
    // get old keys as int array
    var oldKeys = Object.keys(devices).map(function (k) { return +k; }).sort();
    // get new keys as int array
    var newKeys = newDevices.sort();
    // translate that into added and removed devices
    var addedKeys = array_extensions_1.except(newKeys, oldKeys);
    global_1.Global.log("adding devices with keys " + JSON.stringify(addedKeys), { level: global_1.Global.loglevels.ridiculous });
    addedKeys.forEach(function (id) {
        var observerUrl = "" + requestBase + endpoints_1.default.devices + "/" + id;
        if (observers.indexOf(observerUrl) > -1)
            return;
        // start observing
        node_coap_client_1.CoapClient.observe(observerUrl, "get", function (resp) { return coap_getDevice_cb(id, resp); });
        observers.push(observerUrl);
    });
    var removedKeys = array_extensions_1.except(oldKeys, newKeys);
    global_1.Global.log("removing devices with keys " + JSON.stringify(removedKeys), { level: global_1.Global.loglevels.ridiculous });
    removedKeys.forEach(function (id) {
        // remove device from dictionary
        if (devices.hasOwnProperty(id))
            delete devices[id];
        // remove observer
        var observerUrl = "" + requestBase + endpoints_1.default.devices + "/" + id;
        var index = observers.indexOf(observerUrl);
        if (index === -1)
            return;
        node_coap_client_1.CoapClient.stopObserving(observerUrl);
        observers.splice(index, 1);
        // TODO: delete ioBroker device
    });
}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(instanceId, response) {
    if (response.code.toString() !== "2.05") {
        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getDevice(" + instanceId + ").", { severity: global_1.Global.severity.error });
        return;
    }
    var result = parsePayload(response);
    // parse device info
    var accessory = new accessory_1.Accessory();
    accessory.parse(result);
    // remember the device object, so we can later use it as a reference for updates
    devices[instanceId] = accessory;
    // create ioBroker device
    extendDevice(accessory);
}
function getAccessoryId(stateId) {
    var match = /^tradfri\.\d+\.[\w\-\d]+/.exec(stateId);
    if (match)
        return match[0];
}
function calcObjId(accessory) {
    // TODO: Make strongly typed objects so we can define this as <Accessory>
    var prefix = (function () {
        switch (accessory.type) {
            case accessory_1.AccessoryTypes.remote:
                return "RC";
            case accessory_1.AccessoryTypes.lightbulb:
                return "L";
            default:
                global_1.Global.log("unknown accessory type " + accessory.type);
                return "XYZ";
        }
    })();
    return adapter.namespace + "." + prefix + "-" + accessory.instanceId;
}
// finds the property value for <accessory> as defined in <propPath>
function readPropertyValue(accessory, propPath) {
    // TODO: Make strongly typed objects so we can define this as <Accessory>
    // if path starts with "__convert:", use a custom conversion function
    if (propPath.startsWith("__convert:")) {
        var pathParts = propPath.substr("__convert:".length).split(",");
        try {
            var fnName = pathParts[0];
            var path = pathParts[1];
            // find initial value on the object
            var value = object_polyfill_1.dig(accessory, path);
            // and convert it
            return conversions_1.default[fnName]("in", value);
        }
        catch (e) {
            global_1.Global.log("invalid path definition ${propPath}");
        }
    }
    else {
        return object_polyfill_1.dig(accessory, propPath);
    }
}
// creates or edits an existing <device>-object for an accessory
function extendDevice(accessory) {
    // TODO: Make strongly typed objects so we can define this as <Accessory>
    var objId = calcObjId(accessory);
    if (global_1.Global.isdef(objects[objId])) {
        // check if we need to edit the existing object
        var devObj = objects[objId];
        var changed = false;
        // update common part if neccessary
        var newCommon = {
            name: accessory.name,
        };
        if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
            devObj.common = newCommon;
            changed = true;
        }
        var newNative = {
            instanceId: accessory.instanceId,
            manufacturer: accessory.deviceInfo.manufacturer,
            firmwareVersion: accessory.deviceInfo.firmwareVersion,
        };
        // update native part if neccessary
        if (JSON.stringify(devObj.native) !== JSON.stringify(newNative)) {
            devObj.native = newNative;
            changed = true;
        }
        if (changed)
            adapter.extendObject(objId, devObj);
        // ====
        // from here we can update the states
        // filter out the ones belonging to this device with a property path
        var stateObjs = object_polyfill_1.filter(objects, function (obj) { return obj._id.startsWith(objId) && obj.native && obj.native.path; });
        // for each property try to update the value
        for (var _i = 0, _a = object_polyfill_1.entries(stateObjs); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], obj = _b[1];
            try {
                // Object could have a default value, find it
                var newValue = readPropertyValue(accessory, obj.native.path);
                adapter.setState(id, newValue, true);
            }
            catch (e) { }
        }
    }
    else {
        // create new object
        var devObj = {
            _id: objId,
            type: "device",
            common: {
                name: accessory.name,
            },
            native: {
                instanceId: accessory.instanceId,
                manufacturer: accessory.deviceInfo.manufacturer,
                firmwareVersion: accessory.deviceInfo.firmwareVersion,
            },
        };
        adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        var stateObjs_1 = {
            alive: {
                _id: objId + ".alive",
                type: "state",
                common: {
                    name: "device alive",
                    read: true,
                    write: false,
                    type: "boolean",
                    role: "indicator.alive",
                    desc: "indicates if the device is currently alive and connected to the gateway",
                },
                native: {
                    path: "alive",
                },
            },
            lastSeen: {
                _id: objId + ".lastSeen",
                type: "state",
                common: {
                    name: "last seen timestamp",
                    read: true,
                    write: false,
                    type: "number",
                    role: "indicator.lastSeen",
                    desc: "indicates when the device has last been seen by the gateway",
                },
                native: {
                    path: "lastSeen",
                },
            },
        };
        if (accessory.type === accessory_1.AccessoryTypes.lightbulb) {
            stateObjs_1["lightbulb.color"] = {
                _id: objId + ".lightbulb.color",
                type: "state",
                common: {
                    name: "color temperature of the lightbulb",
                    read: true,
                    write: true,
                    min: 0,
                    max: 100,
                    unit: "%",
                    type: "number",
                    role: "level.color.temperature",
                    desc: "range: 0% = cold, 100% = warm",
                },
                native: {
                    path: "__convert:color,lightList.[0].colorX",
                },
            };
            stateObjs_1["lightbulb.brightness"] = {
                _id: objId + ".lightbulb.brightness",
                type: "state",
                common: {
                    name: "brightness",
                    read: true,
                    write: true,
                    min: 0,
                    max: 254,
                    type: "number",
                    role: "level",
                    desc: "brightness of the lightbulb",
                },
                native: {
                    path: "lightList.[0].dimmer",
                },
            };
            stateObjs_1["lightbulb.state"] = {
                _id: objId + ".lightbulb.state",
                type: "state",
                common: {
                    name: "on/off",
                    read: true,
                    write: true,
                    type: "boolean",
                    role: "switch",
                },
                native: {
                    path: "lightList.[0].onOff",
                },
            };
        }
        var createObjects = Object.keys(stateObjs_1)
            .map(function (key) {
            var stateId = objId + "." + key;
            var obj = stateObjs_1[key];
            var initialValue = null;
            if (global_1.Global.isdef(obj.native.path)) {
                // Object could have a default value, find it
                initialValue = readPropertyValue(accessory, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return adapter.$createOwnStateEx(stateId, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
// ==================================
// Custom subscriptions
/**
 * Ensures the subscription pattern is valid
 */
function checkPattern(pattern) {
    try {
        if (typeof pattern === "string") {
            return str2regex_1.str2regex(pattern);
        }
        else if (pattern instanceof RegExp) {
            return pattern;
        }
        else {
            // NOPE
            throw new Error("must be regex or string");
        }
    }
    catch (e) {
        global_1.Global.log("cannot subscribe with this pattern. reason: " + e);
        return null;
    }
}
/**
 * Subscribe to some ioBroker states
 * @param pattern
 * @param callback
 * @returns a subscription ID
 */
function subscribeStates(pattern, callback) {
    pattern = checkPattern(pattern);
    if (!pattern)
        return;
    var newCounter = (++customStateSubscriptions.counter);
    var id = "" + newCounter;
    customStateSubscriptions.subscriptions[id] = { pattern: pattern, callback: callback };
    return id;
}
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id) {
    if (customStateSubscriptions.subscriptions[id]) {
        delete customStateSubscriptions.subscriptions[id];
    }
}
/**
 * Subscribe to some ioBroker objects
 * @param pattern
 * @param callback
 * @returns a subscription ID
 */
function subscribeObjects(pattern, callback) {
    pattern = checkPattern(pattern);
    if (!pattern)
        return;
    var newCounter = (++customObjectSubscriptions.counter);
    var id = "" + newCounter;
    customObjectSubscriptions.subscriptions[id] = { pattern: pattern, callback: callback };
    return id;
}
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id) {
    if (customObjectSubscriptions.subscriptions[id]) {
        delete customObjectSubscriptions.subscriptions[id];
    }
}
function parsePayload(response) {
    switch (response.format) {
        case 0:
            return response.payload.toString("utf-8");
        case 50:
            var json = response.payload.toString("utf-8");
            return JSON.parse(json);
        default:
            return response.payload;
    }
}
// Unbehandelte Fehler tracen
process.on("unhandledRejection", function (r) {
    adapter.log.error("unhandled promise rejection: " + r);
});
process.on("uncaughtException", function (err) {
    adapter.log.error("unhandled exception:" + err.message);
    adapter.log.error("> stack: " + err.stack);
    process.exit(1);
});
//# sourceMappingURL=main.js.map