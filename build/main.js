"use strict";
// tslint:disable:object-literal-key-quotes
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
// tslint:disable-next-line:no-var-requires
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
var group_1 = require("./ipso/group");
var scene_1 = require("./ipso/scene");
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
var groups = {};
// dictionary of ioBroker objects
var objects = {};
// the base of all requests
var requestBase;
// Adapter-Objekt erstellen
var adapter = utils_1.default.adapter({
    name: "tradfri",
    // Wird aufgerufen, wenn Adapter initialisiert wird
    ready: function () { return __awaiter(_this, void 0, void 0, function () {
        var hostname;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
                    if (adapter.config
                        && adapter.config.host != null && adapter.config.host !== ""
                        && adapter.config.securityCode != null && adapter.config.securityCode !== "") {
                        // alles gut
                    }
                    else {
                        adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
                        return [2 /*return*/];
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
                    hostname = adapter.config.host.toLowerCase();
                    node_coap_client_1.CoapClient.setSecurityParams(hostname, {
                        psk: { "Client_identity": adapter.config.securityCode },
                    });
                    requestBase = "coaps://" + hostname + ":5684/";
                    // TODO: load known devices from ioBroker into <devices> & <objects>
                    // TODO: we might need the send-queue branch of node-coap-client at some point
                    return [4 /*yield*/, observeDevices()];
                case 1:
                    // TODO: load known devices from ioBroker into <devices> & <objects>
                    // TODO: we might need the send-queue branch of node-coap-client at some point
                    _a.sent();
                    return [4 /*yield*/, observeGroups()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); },
    message: function (obj) { return __awaiter(_this, void 0, void 0, function () {
        // responds to the adapter that sent the original message
        function respond(response) {
            if (obj.callback)
                adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
        // make required parameters easier
        function requireParams() {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            if (!(params && params.length))
                return true;
            for (var _a = 0, params_1 = params; _a < params_1.length; _a++) {
                var param = params_1[_a];
                if (!(obj.message && obj.message.hasOwnProperty(param))) {
                    respond(predefinedResponses.MISSING_PARAMETER(param));
                    return false;
                }
            }
            return true;
        }
        var predefinedResponses, _a, params, payload, resp;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    predefinedResponses = {
                        ACK: { error: null },
                        OK: { error: null, result: "ok" },
                        ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
                        MISSING_PARAMETER: function (paramName) {
                            return { error: 'missing parameter "' + paramName + '"!' };
                        },
                        COMMAND_RUNNING: { error: "command running" },
                    };
                    if (!obj) return [3 /*break*/, 4];
                    _a = obj.command;
                    switch (_a) {
                        case "request": return [3 /*break*/, 1];
                    }
                    return [3 /*break*/, 3];
                case 1:
                    // require the path to be given
                    if (!requireParams("path"))
                        return [2 /*return*/];
                    params = obj.message;
                    params.method = params.method || "get";
                    if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
                        respond({ error: "unsupported request method \"" + params.method + "\"" });
                        return [2 /*return*/];
                    }
                    global_1.Global.log("custom coap request: " + params.method.toUpperCase() + " \"" + requestBase + params.path + "\"", { level: global_1.Global.loglevels.on });
                    payload = void 0;
                    if (params.payload) {
                        payload = JSON.stringify(params.payload);
                        global_1.Global.log("sending custom payload: " + payload, { level: global_1.Global.loglevels.on });
                        payload = Buffer.from(payload);
                    }
                    return [4 /*yield*/, node_coap_client_1.CoapClient.request("" + requestBase + params.path, params.method, payload)];
                case 2:
                    resp = _b.sent();
                    respond({
                        error: null, result: {
                            code: resp.code.toString(),
                            payload: parsePayload(resp),
                        },
                    });
                    return [2 /*return*/];
                case 3:
                    respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                    return [2 /*return*/];
                case 4: return [2 /*return*/];
            }
        });
    }); },
    objectChange: function (id, obj) {
        global_1.Global.log("{{blue}} object with id " + id + " " + (obj ? "updated" : "deleted"), { level: global_1.Global.loglevels.ridiculous });
        if (id.startsWith(adapter.namespace)) {
            // this is our own object.
            if (obj) {
                // first check if we have to modify a device/group/whatever
                var instanceId = getInstanceId(id);
                if (obj.type === "device" && instanceId in devices && devices[instanceId] != null) {
                    // if this device is in the device list, check for changed properties
                    var acc = devices[instanceId];
                    if (obj.common && obj.common.name !== acc.name) {
                        // the name has changed, notify the gateway
                        global_1.Global.log("the device " + id + " was renamed to \"" + obj.common.name + "\"");
                        renameDevice(acc, obj.common.name);
                    }
                }
                else if (obj.type === "channel" && instanceId in groups && groups[instanceId] != null) {
                    // if this group is in the groups list, check for changed properties
                    var grp = groups[instanceId].group;
                    if (obj.common && obj.common.name !== grp.name) {
                        // the name has changed, notify the gateway
                        global_1.Global.log("the group " + id + " was renamed to \"" + obj.common.name + "\"");
                        renameGroup(grp, obj.common.name);
                    }
                }
                // remember the object
                objects[id] = obj;
            }
            else {
                // object deleted, forget it
                if (id in objects)
                    delete objects[id];
            }
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
        var stateObj, rootId, rootObj, val, serializedObj, url, group, newGroup, accessory, newAccessory, light, colorX, payload, _i, _a, sub;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (state) {
                        global_1.Global.log("{{blue}} state with id " + id + " updated: ack=" + state.ack + "; val=" + state.val, { level: global_1.Global.loglevels.ridiculous });
                    }
                    else {
                        global_1.Global.log("{{blue}} state with id " + id + " deleted", { level: global_1.Global.loglevels.ridiculous });
                    }
                    if (!(state && !state.ack && id.startsWith(adapter.namespace))) return [3 /*break*/, 4];
                    stateObj = objects[id];
                    if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
                        return [2 /*return*/];
                    rootId = getRootId(id);
                    if (!rootId) return [3 /*break*/, 3];
                    rootObj = objects[rootId];
                    val = state.val;
                    // make sure we have whole numbers
                    if (stateObj.common.type === "number") {
                        val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
                        if (global_1.Global.isdef(stateObj.common.min))
                            val = Math.max(stateObj.common.min, val);
                        if (global_1.Global.isdef(stateObj.common.max))
                            val = Math.min(stateObj.common.max, val);
                    }
                    serializedObj = void 0;
                    url = void 0;
                    switch (rootObj.native.type) {
                        case "group":
                            group = groups[rootObj.native.instanceId].group;
                            newGroup = group.clone();
                            if (id.endsWith("state")) {
                                // just turn on or off
                                newGroup.onOff = val;
                            }
                            else if (id.endsWith("activeScene")) {
                                // turn on and activate a scene
                                newGroup.merge({
                                    onOff: true,
                                    sceneId: val,
                                });
                            }
                            serializedObj = newGroup.serialize(group); // serialize with the old object as a reference
                            url = "" + requestBase + endpoints_1.default.groups + "/" + rootObj.native.instanceId;
                            break;
                        default:
                            accessory = devices[rootObj.native.instanceId];
                            newAccessory = accessory.clone();
                            if (id.indexOf(".lightbulb.") > -1) {
                                light = newAccessory.lightList[0];
                                if (id.endsWith(".state")) {
                                    light.merge({ onOff: val });
                                }
                                else if (id.endsWith(".brightness")) {
                                    light.merge({
                                        dimmer: val,
                                        transitionTime: 5,
                                    });
                                }
                                else if (id.endsWith(".color")) {
                                    colorX = conversions_1.default.color("out", state.val);
                                    light.merge({
                                        colorX: colorX,
                                        colorY: 27000,
                                        transitionTime: 5,
                                    });
                                }
                            }
                            serializedObj = newAccessory.serialize(accessory); // serialize with the old object as a reference
                            url = "" + requestBase + endpoints_1.default.devices + "/" + rootObj.native.instanceId;
                            break;
                    }
                    if (!(!serializedObj || Object.keys(serializedObj).length === 0)) return [3 /*break*/, 2];
                    global_1.Global.log("stateChange > empty object, not sending any payload", { level: global_1.Global.loglevels.ridiculous });
                    return [4 /*yield*/, adapter.$setState(id, state.val, true)];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    payload = JSON.stringify(serializedObj);
                    global_1.Global.log("stateChange > sending payload: " + payload, { level: global_1.Global.loglevels.ridiculous });
                    payload = Buffer.from(payload);
                    node_coap_client_1.CoapClient.request(url, "put", payload);
                    _b.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    if (!state) {
                        // TODO: find out what to do when states are deleted
                    }
                    _b.label = 5;
                case 5:
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
/** Normalizes the path to a resource, so it can be used for storing the observer */
function normalizeResourcePath(path) {
    path = path || "";
    while (path.startsWith("/"))
        path = path.substring(1);
    while (path.endsWith("/"))
        path = path.substring(0, -1);
    return path;
}
/**
 * Observes a resource at the given url and calls the callback when the information is updated
 * @param path The path of the resource (without requestBase)
 * @param callback The callback to be invoked when the resource updates
 */
function observeResource(path, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var observerUrl;
        return __generator(this, function (_a) {
            path = normalizeResourcePath(path);
            observerUrl = "" + requestBase + path;
            if (observers.indexOf(observerUrl) > -1)
                return [2 /*return*/];
            // start observing
            observers.push(observerUrl);
            return [2 /*return*/, node_coap_client_1.CoapClient.observe(observerUrl, "get", callback)];
        });
    });
}
/**
 * Stops observing a resource
 * @param path The path of the resource (without requestBase)
 */
function stopObservingResource(path) {
    path = normalizeResourcePath(path);
    // remove observer
    var observerUrl = "" + requestBase + path;
    var index = observers.indexOf(observerUrl);
    if (index === -1)
        return;
    node_coap_client_1.CoapClient.stopObserving(observerUrl);
    observers.splice(index, 1);
}
/** Sets up an observer for all devices */
function observeDevices() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, observeResource(endpoints_1.default.devices, coapCb_getAllDevices)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// gets called whenever "get /15001" updates
function coapCb_getAllDevices(response) {
    return __awaiter(this, void 0, void 0, function () {
        var newDevices, oldKeys, newKeys, addedKeys, addDevices, removedKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (response.code.toString() !== "2.05") {
                        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getAllDevices.", { severity: global_1.Global.severity.error });
                        return [2 /*return*/];
                    }
                    newDevices = parsePayload(response);
                    global_1.Global.log("got all devices: " + JSON.stringify(newDevices));
                    oldKeys = Object.keys(devices).map(function (k) { return +k; }).sort();
                    newKeys = newDevices.sort();
                    addedKeys = array_extensions_1.except(newKeys, oldKeys);
                    global_1.Global.log("adding devices with keys " + JSON.stringify(addedKeys), { level: global_1.Global.loglevels.ridiculous });
                    addDevices = addedKeys.map(function (id) {
                        return observeResource(endpoints_1.default.devices + "/" + id, function (resp) { return coap_getDevice_cb(id, resp); });
                    });
                    return [4 /*yield*/, Promise.all(addDevices)];
                case 1:
                    _a.sent();
                    removedKeys = array_extensions_1.except(oldKeys, newKeys);
                    global_1.Global.log("removing devices with keys " + JSON.stringify(removedKeys), { level: global_1.Global.loglevels.ridiculous });
                    removedKeys.forEach(function (id) {
                        // remove device from dictionary
                        if (devices.hasOwnProperty(id))
                            delete devices[id];
                        // remove observer
                        stopObservingResource(endpoints_1.default.devices + "/" + id);
                        // TODO: delete ioBroker device
                    });
                    return [2 /*return*/];
            }
        });
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
/** Sets up an observer for all groups */
function observeGroups() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, observeResource(endpoints_1.default.groups, coapCb_getAllGroups)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// gets called whenever "get /15004" updates
function coapCb_getAllGroups(response) {
    return __awaiter(this, void 0, void 0, function () {
        var newGroups, oldKeys, newKeys, addedKeys, addGroups, removedKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (response.code.toString() !== "2.05") {
                        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getAllGroups.", { severity: global_1.Global.severity.error });
                        return [2 /*return*/];
                    }
                    newGroups = parsePayload(response);
                    global_1.Global.log("got all groups: " + JSON.stringify(newGroups));
                    oldKeys = Object.keys(devices).map(function (k) { return +k; }).sort();
                    newKeys = newGroups.sort();
                    addedKeys = array_extensions_1.except(newKeys, oldKeys);
                    global_1.Global.log("adding groups with keys " + JSON.stringify(addedKeys), { level: global_1.Global.loglevels.ridiculous });
                    addGroups = addedKeys.map(function (id) {
                        return observeResource(endpoints_1.default.groups + "/" + id, function (resp) { return coap_getGroup_cb(id, resp); });
                    });
                    return [4 /*yield*/, Promise.all(addGroups)];
                case 1:
                    _a.sent();
                    removedKeys = array_extensions_1.except(oldKeys, newKeys);
                    global_1.Global.log("removing groups with keys " + JSON.stringify(removedKeys), { level: global_1.Global.loglevels.ridiculous });
                    removedKeys.forEach(function (id) {
                        // remove device from dictionary
                        if (devices.hasOwnProperty(id))
                            delete devices[id];
                        // remove observer
                        stopObservingResource(endpoints_1.default.groups + "/" + id);
                        // TODO: delete ioBroker device
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// gets called whenever "get /15004/<instanceId>" updates
function coap_getGroup_cb(instanceId, response) {
    if (response.code.toString() !== "2.05") {
        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getGroup(" + instanceId + ").", { severity: global_1.Global.severity.error });
        return;
    }
    var result = parsePayload(response);
    // parse group info
    var group = (new group_1.Group()).parse(result);
    // remember the group object, so we can later use it as a reference for updates
    groups[instanceId] = {
        group: group,
        scenes: {},
    };
    // create ioBroker states
    extendGroup(group);
    // and load scene information
    observeResource(endpoints_1.default.scenes + "/" + instanceId, function (resp) { return coap_getAllScenes_cb(instanceId, resp); });
}
// gets called whenever "get /15005/<groupId>" updates
function coap_getAllScenes_cb(groupId, response) {
    return __awaiter(this, void 0, void 0, function () {
        var groupInfo, newScenes, oldKeys, newKeys, addedKeys, addScenes, removedKeys;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (response.code.toString() !== "2.05") {
                        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getAllScenes(" + groupId + ").", { severity: global_1.Global.severity.error });
                        return [2 /*return*/];
                    }
                    groupInfo = groups[groupId];
                    newScenes = parsePayload(response);
                    global_1.Global.log("got all scenes in group " + groupId + ": " + JSON.stringify(newScenes));
                    oldKeys = Object.keys(groupInfo.scenes).map(function (k) { return +k; }).sort();
                    newKeys = newScenes.sort();
                    addedKeys = array_extensions_1.except(newKeys, oldKeys);
                    global_1.Global.log("adding scenes with keys " + JSON.stringify(addedKeys) + " to group " + groupId, { level: global_1.Global.loglevels.ridiculous });
                    addScenes = addedKeys.map(function (id) {
                        return observeResource(endpoints_1.default.scenes + "/" + groupId + "/" + id, function (resp) { return coap_getScene_cb(groupId, id, resp); });
                    });
                    return [4 /*yield*/, Promise.all(addScenes)];
                case 1:
                    _a.sent();
                    removedKeys = array_extensions_1.except(oldKeys, newKeys);
                    global_1.Global.log("removing scenes with keys " + JSON.stringify(removedKeys) + " from group " + groupId, { level: global_1.Global.loglevels.ridiculous });
                    removedKeys.forEach(function (id) {
                        // remove device from dictionary
                        if (groupInfo.scenes.hasOwnProperty(id))
                            delete groupInfo.scenes[id];
                        // remove observer
                        stopObservingResource(endpoints_1.default.scenes + "/" + groupId + "/" + id);
                        // TODO: delete ioBroker device
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// gets called whenever "get /15005/<groupId>/<instanceId>" updates
function coap_getScene_cb(groupId, instanceId, response) {
    if (response.code.toString() !== "2.05") {
        global_1.Global.log("unexpected response (" + response.code.toString() + ") to getScene(" + groupId + ", " + instanceId + ").", { severity: global_1.Global.severity.error });
        return;
    }
    var result = parsePayload(response);
    // parse scene info
    var scene = (new scene_1.Scene()).parse(result);
    // remember the scene object, so we can later use it as a reference for updates
    groups[groupId].scenes[instanceId] = scene;
    // Update the scene dropdown for the group
    updatePossibleScenes(groups[groupId].group);
}
/**
 * Returns the ioBroker id of the root object for the given state
 */
function getRootId(stateId) {
    var match = /^tradfri\.\d+\.\w+\-\d+/.exec(stateId);
    if (match)
        return match[0];
}
/**
 * Extracts the instance id from a given state or object id
 * @param id State or object id whose instance id should be extracted
 */
function getInstanceId(id) {
    var match = /^tradfri\.\d+\.\w+\-(\d+)/.exec(id);
    if (match)
        return +match[1];
}
/**
 * Determines the object ID under which the given accessory should be stored
 */
function calcObjId(accessory) {
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
/**
 * Determines the object ID under which the given group should be stored
 */
function calcGroupId(group) {
    return adapter.namespace + ".G-" + group.instanceId;
}
/**
 * Determines the object ID under which the given scene should be stored
 */
function calcSceneId(scene) {
    return adapter.namespace + ".S-" + scene.instanceId;
}
/**
 * finds the property value for @link{accessory} as defined in @link{propPath}
 * @param The accessory to be searched for the property
 * @param The property path under which the property is accessible
 */
function readPropertyValue(source, propPath) {
    // if path starts with "__convert:", use a custom conversion function
    if (propPath.startsWith("__convert:")) {
        var pathParts = propPath.substr("__convert:".length).split(",");
        try {
            var fnName = pathParts[0];
            var path = pathParts[1];
            // find initial value on the object
            var value = object_polyfill_1.dig(source, path);
            // and convert it
            return conversions_1.default[fnName]("in", value);
        }
        catch (e) {
            global_1.Global.log("invalid path definition " + propPath);
        }
    }
    else {
        return object_polyfill_1.dig(source, propPath);
    }
}
/**
 * Returns the common part of the ioBroker object representing the given accessory
 */
function accessoryToCommon(accessory) {
    return {
        name: accessory.name,
    };
}
/**
 * Returns the native part of the ioBroker object representing the given accessory
 */
function accessoryToNative(accessory) {
    return {
        instanceId: accessory.instanceId,
        manufacturer: accessory.deviceInfo.manufacturer,
        firmwareVersion: accessory.deviceInfo.firmwareVersion,
        modelNumber: accessory.deviceInfo.modelNumber,
        type: accessory_1.AccessoryTypes[accessory.type],
        serialNumber: accessory.deviceInfo.serialNumber,
    };
}
/* creates or edits an existing <device>-object for an accessory */
function extendDevice(accessory) {
    var objId = calcObjId(accessory);
    if (global_1.Global.isdef(objects[objId])) {
        // check if we need to edit the existing object
        var devObj = objects[objId];
        var changed = false;
        // update common part if neccessary
        var newCommon = accessoryToCommon(accessory);
        if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
            // merge the common objects
            Object.assign(devObj.common, newCommon);
            changed = true;
        }
        var newNative = accessoryToNative(accessory);
        // update native part if neccessary
        if (JSON.stringify(devObj.native) !== JSON.stringify(newNative)) {
            // merge the native objects
            Object.assign(devObj.native, newNative);
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
            common: accessoryToCommon(accessory),
            native: accessoryToNative(accessory),
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
            // obj.lightbulb should be a channel
            stateObjs_1.lightbulb = {
                _id: objId + ".lightbulb",
                type: "channel",
                common: {
                    name: "Lightbulb",
                    role: "light",
                },
                native: {},
            };
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
                    role: "light.dimmer",
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
/**
 * Returns the common part of the ioBroker object representing the given group
 */
function groupToCommon(group) {
    return {
        name: group.name,
    };
}
/**
 * Returns the native part of the ioBroker object representing the given group
 */
function groupToNative(group) {
    return {
        instanceId: group.instanceId,
        deviceIDs: group.deviceIDs,
        type: "group",
    };
}
/* creates or edits an existing <group>-object for a group */
function extendGroup(group) {
    var objId = calcGroupId(group);
    if (global_1.Global.isdef(objects[objId])) {
        // check if we need to edit the existing object
        var grpObj = objects[objId];
        var changed = false;
        // update common part if neccessary
        var newCommon = groupToCommon(group);
        if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
            // merge the common objects
            Object.assign(grpObj.common, newCommon);
            changed = true;
        }
        var newNative = groupToNative(group);
        // update native part if neccessary
        if (JSON.stringify(grpObj.native) !== JSON.stringify(newNative)) {
            // merge the native objects
            Object.assign(grpObj.native, newNative);
            changed = true;
        }
        if (changed)
            adapter.extendObject(objId, grpObj);
        // ====
        // from here we can update the states
        // filter out the ones belonging to this device with a property path
        var stateObjs = object_polyfill_1.filter(objects, function (obj) { return obj._id.startsWith(objId) && obj.native && obj.native.path; });
        // for each property try to update the value
        for (var _i = 0, _a = object_polyfill_1.entries(stateObjs); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], obj = _b[1];
            try {
                // Object could have a default value, find it
                var newValue = readPropertyValue(group, obj.native.path);
                adapter.setState(id, newValue, true);
            }
            catch (e) { }
        }
    }
    else {
        // create new object
        var devObj = {
            _id: objId,
            type: "channel",
            common: groupToCommon(group),
            native: groupToNative(group),
        };
        adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        var stateObjs_2 = {
            activeScene: {
                _id: objId + ".activeScene",
                type: "state",
                common: {
                    name: "active scene",
                    read: true,
                    write: true,
                    type: "number",
                    role: "value.id",
                    desc: "the instance id of the currently active scene",
                },
                native: {
                    path: "sceneId",
                },
            },
            state: {
                _id: objId + ".state",
                type: "state",
                common: {
                    name: "on/off",
                    read: true,
                    write: true,
                    type: "boolean",
                    role: "switch",
                },
                native: {
                    path: "onOff",
                },
            },
        };
        var createObjects = Object.keys(stateObjs_2)
            .map(function (key) {
            var stateId = objId + "." + key;
            var obj = stateObjs_2[key];
            var initialValue = null;
            if (global_1.Global.isdef(obj.native.path)) {
                // Object could have a default value, find it
                initialValue = readPropertyValue(group, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return adapter.$createOwnStateEx(stateId, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
function updatePossibleScenes(group) {
    return __awaiter(this, void 0, void 0, function () {
        var objId, scenesId, activeSceneObj, scenes_1, states;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // if this group is not in the dictionary, don't do anything
                    if (!(group.instanceId in groups))
                        return [2 /*return*/];
                    objId = calcGroupId(group);
                    scenesId = objId + ".activeScene";
                    if (!global_1.Global.isdef(objects[scenesId])) return [3 /*break*/, 2];
                    activeSceneObj = objects[scenesId];
                    scenes_1 = groups[group.instanceId].scenes;
                    states = object_polyfill_1.composeObject(Object.keys(scenes_1).map(function (id) { return [id, scenes_1[id].name]; }));
                    return [4 /*yield*/, adapter.extendObject(scenesId, { common: { states: states } } /* This is a partial of a partial, not correctly defined in ioBroker.d.ts */)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2: return [2 /*return*/];
            }
        });
    });
}
/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 */
function renameDevice(accessory, newName) {
    // create a copy to modify
    var newAccessory = accessory.clone();
    newAccessory.name = newName;
    // serialize with the old object as a reference
    var serializedObj = newAccessory.serialize(accessory);
    // If the serialized object contains no properties, we don't need to send anything
    if (!serializedObj || Object.keys(serializedObj).length === 0) {
        global_1.Global.log("renameDevice > empty object, not sending any payload", { level: global_1.Global.loglevels.ridiculous });
        return;
    }
    // get the payload
    var payload = JSON.stringify(serializedObj);
    global_1.Global.log("renameDevice > sending payload: " + payload, { level: global_1.Global.loglevels.ridiculous });
    payload = Buffer.from(payload);
    node_coap_client_1.CoapClient.request("" + requestBase + endpoints_1.default.devices + "/" + accessory.instanceId, "put", payload);
}
/**
 * Renames a group
 * @param group The group to be renamed
 * @param newName The new name to be given to the group
 */
function renameGroup(group, newName) {
    // create a copy to modify
    var newGroup = group.clone();
    newGroup.name = newName;
    // serialize with the old object as a reference
    var serializedObj = newGroup.serialize(group);
    // If the serialized object contains no properties, we don't need to send anything
    if (!serializedObj || Object.keys(serializedObj).length === 0) {
        global_1.Global.log("renameGroup > empty object, not sending any payload", { level: global_1.Global.loglevels.ridiculous });
        return;
    }
    // get the payload
    var payload = JSON.stringify(serializedObj);
    global_1.Global.log("renameDevice > sending payload: " + payload, { level: global_1.Global.loglevels.ridiculous });
    payload = Buffer.from(payload);
    node_coap_client_1.CoapClient.request("" + requestBase + endpoints_1.default.groups + "/" + group.instanceId, "put", payload);
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
        case 0: // text/plain
        case null:
            return response.payload.toString("utf-8");
        case 50:
            var json = response.payload.toString("utf-8");
            return JSON.parse(json);
        default:
            // dunno how to parse this
            global_1.Global.log("unknown CoAP response format " + response.format, { severity: global_1.Global.severity.warn });
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