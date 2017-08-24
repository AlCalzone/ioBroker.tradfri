// tslint:disable:object-literal-key-quotes
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Eigene Module laden
var node_coap_client_1 = require("node-coap-client");
var endpoints_1 = require("./ipso/endpoints");
var array_extensions_1 = require("./lib/array-extensions");
var global_1 = require("./lib/global");
var object_polyfill_1 = require("./lib/object-polyfill");
var str2regex_1 = require("./lib/str2regex");
// Datentypen laden
var accessory_1 = require("./ipso/accessory");
var accessoryTypes_1 = require("./ipso/accessoryTypes");
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
    stateChange: function (id, state) {
        global_1.Global.log("{{blue}} state with id " + id + " updated: ack=" + state.ack + "; val=" + state.val, { level: global_1.Global.loglevels.ridiculous });
        if (!state.ack && id.startsWith(adapter.namespace)) {
            // our own state was changed from within ioBroker, react to it
            var stateObj = objects[id];
            if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
                return;
            // get "official" value for the parent object
            var devId = getAccessoryId(id);
            if (devId) {
                // get the ioBroker object
                var dev = objects[devId];
                // read the instanceId and get a reference value
                var accessory = devices[dev.native.instanceId];
                // for now: handle changes on a case by case basis
                // everything else is too complicated for now
                var val = state.val;
                // make sure we have whole numbers
                if (stateObj.common.type === "number") {
                    val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
                    if (global_1.Global.isdef(stateObj.common.min))
                        val = Math.max(stateObj.common.min, val);
                    if (global_1.Global.isdef(stateObj.common.max))
                        val = Math.min(stateObj.common.max, val);
                }
                // TODO: find a way to construct these from existing accessory objects
                var payload = null;
                if (id.endsWith(".lightbulb.state")) {
                    payload = { "3311": [{ "5850": (val ? 1 : 0) }] };
                }
                else if (id.endsWith(".lightbulb.brightness")) {
                    payload = { "3311": [{ "5851": val, "5712": 5 }] };
                }
                else if (id.endsWith(".lightbulb.color")) {
                    var colorX = conversions_1.default.color("out", state.val);
                    payload = { "3311": [{ "5709": colorX, "5710": 27000, "5712": 5 }] };
                }
                payload = JSON.stringify(payload);
                global_1.Global.log("sending payload: " + payload, { level: global_1.Global.loglevels.ridiculous });
                payload = Buffer.from(payload);
                node_coap_client_1.CoapClient.request("" + requestBase + endpoints_1.default.devices + "/" + dev.native.instanceId, "put", payload);
            }
        }
        // Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
        try {
            for (var _i = 0, _a = object_polyfill_1.values(customStateSubscriptions.subscriptions); _i < _a.length; _i++) {
                var sub = _a[_i];
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
    },
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
        // make a dummy object, we'll be filling that one later
        devices[id] = {};
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
    var accessory = new accessory_1.default(result);
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
    var prefix = (function () {
        switch (accessory.type) {
            case accessoryTypes_1.accessoryTypes.remote:
                return "RC";
            case accessoryTypes_1.accessoryTypes.lightbulb:
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
                if (obj.type === "state" && obj.common.type === "boolean") {
                    // fix bool values
                    newValue = newValue === 1 || newValue === "true" || newValue === "on";
                }
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
        if (accessory.type === accessoryTypes_1.accessoryTypes.lightbulb) {
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
// Object.assign(customSubscriptions, {
// 	counter: 0,
// 	subscriptions: {
// 		// "<id>" : {pattern, callback}
// 	},
// });
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
    // _.log(`added subscription for pattern ${pattern}. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
    return id;
}
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id) {
    // _.log(`unsubscribing subscription #${id}...`);
    if (customStateSubscriptions.subscriptions[id]) {
        // const pattern = customSubscriptions.subscriptions[id].pattern;
        delete customStateSubscriptions.subscriptions[id];
        // _.log(`unsubscribe ${pattern}: success. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
    }
    else {
        // _.log(`unsubscribe: subscription not found`);
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
    // _.log(`added subscription for pattern ${pattern}. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
    return id;
}
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id) {
    // _.log(`unsubscribing subscription #${id}...`);
    if (customObjectSubscriptions.subscriptions[id]) {
        // const pattern = customSubscriptions.subscriptions[id].pattern;
        delete customObjectSubscriptions.subscriptions[id];
        // _.log(`unsubscribe ${pattern}: success. total count: ${Object.keys(customSubscriptions.subscriptions).length}`);
    }
    else {
        // _.log(`unsubscribe: subscription not found`);
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