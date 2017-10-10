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
Object.defineProperty(exports, "__esModule", { value: true });
// Reflect-polyfill laden
// tslint:disable-next-line:no-var-requires
require("reflect-metadata");
// Eigene Module laden
const node_coap_client_1 = require("node-coap-client");
const endpoints_1 = require("./ipso/endpoints");
const array_extensions_1 = require("./lib/array-extensions");
const global_1 = require("./lib/global");
const object_polyfill_1 = require("./lib/object-polyfill");
const promises_1 = require("./lib/promises");
const str2regex_1 = require("./lib/str2regex");
// Datentypen laden
const accessory_1 = require("./ipso/accessory");
const group_1 = require("./ipso/group");
const scene_1 = require("./ipso/scene");
// Adapter-Utils laden
const utils_1 = require("./lib/utils");
const customStateSubscriptions = {
    subscriptions: new Map(),
    counter: 0,
};
const customObjectSubscriptions = {
    subscriptions: new Map(),
    counter: 0,
};
// dictionary of COAP observers
const observers = [];
// dictionary of known devices
const devices = {};
const groups = {};
// dictionary of ioBroker objects
const objects = {};
// the base of all requests
let requestBase;
// Adapter-Objekt erstellen
let adapter = utils_1.default.adapter({
    name: "tradfri",
    // Wird aufgerufen, wenn Adapter initialisiert wird
    ready: () => __awaiter(this, void 0, void 0, function* () {
        // Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
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
        // Sicherstellen, dass alle Instance-Objects vorhanden sind
        yield global_1.Global.ensureInstanceObjects();
        // redirect console output
        // console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
        // console.error = (msg) => adapter.log.error("STDERR > " + msg);
        global_1.Global.log(`startfile = ${process.argv[1]}`);
        // Eigene Objekte/States beobachten
        adapter.subscribeStates("*");
        adapter.subscribeObjects("*");
        // Custom subscriptions erlauben
        global_1.Global.subscribeStates = subscribeStates;
        global_1.Global.unsubscribeStates = unsubscribeStates;
        global_1.Global.subscribeObjects = subscribeObjects;
        global_1.Global.unsubscribeObjects = unsubscribeObjects;
        // initialize CoAP client
        const hostname = adapter.config.host.toLowerCase();
        node_coap_client_1.CoapClient.setSecurityParams(hostname, {
            psk: { "Client_identity": adapter.config.securityCode },
        });
        requestBase = `coaps://${hostname}:5684/`;
        // Try a few times to setup a working connection
        const maxTries = 3;
        for (let i = 1; i <= maxTries; i++) {
            if (yield node_coap_client_1.CoapClient.tryToConnect(requestBase)) {
                break; // it worked
            }
            else if (i < maxTries) {
                global_1.Global.log(`Could not connect to gateway, try #${i}`, "warn");
                yield promises_1.wait(1000);
            }
            else if (i === maxTries) {
                // no working connection
                global_1.Global.log(`Could not connect to the gateway ${requestBase} after ${maxTries} tries, shutting down.`, "error");
                process.exit(1);
                return;
            }
        }
        yield adapter.$setState("info.connection", true, true);
        connectionAlive = true;
        pingTimer = setInterval(pingThread, 10000);
        // TODO: load known devices from ioBroker into <devices> & <objects>
        observeDevices();
        observeGroups();
    }),
    message: (obj) => __awaiter(this, void 0, void 0, function* () {
        // responds to the adapter that sent the original message
        function respond(response) {
            if (obj.callback)
                adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
        // some predefined responses so we only have to define them once
        const predefinedResponses = {
            ACK: { error: null },
            OK: { error: null, result: "ok" },
            ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
            MISSING_PARAMETER: (paramName) => {
                return { error: 'missing parameter "' + paramName + '"!' };
            },
            COMMAND_RUNNING: { error: "command running" },
        };
        // make required parameters easier
        function requireParams(...params) {
            if (!(params && params.length))
                return true;
            for (const param of params) {
                if (!(obj.message && obj.message.hasOwnProperty(param))) {
                    respond(predefinedResponses.MISSING_PARAMETER(param));
                    return false;
                }
            }
            return true;
        }
        // handle the message
        if (obj) {
            switch (obj.command) {
                case "request":
                    // require the path to be given
                    if (!requireParams("path"))
                        return;
                    // check the given params
                    const params = obj.message;
                    params.method = params.method || "get";
                    if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
                        respond({ error: `unsupported request method "${params.method}"` });
                        return;
                    }
                    global_1.Global.log(`custom coap request: ${params.method.toUpperCase()} "${requestBase}${params.path}"`);
                    // create payload
                    let payload;
                    if (params.payload) {
                        payload = JSON.stringify(params.payload);
                        global_1.Global.log("sending custom payload: " + payload);
                        payload = Buffer.from(payload);
                    }
                    // wait for the CoAP response and respond to the message
                    const resp = yield node_coap_client_1.CoapClient.request(`${requestBase}${params.path}`, params.method, payload);
                    respond({
                        error: null, result: {
                            code: resp.code.toString(),
                            payload: parsePayload(resp),
                        },
                    });
                    return;
                default:
                    respond(predefinedResponses.ERROR_UNKNOWN_COMMAND);
                    return;
            }
        }
    }),
    objectChange: (id, obj) => {
        global_1.Global.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, "debug");
        if (id.startsWith(adapter.namespace)) {
            // this is our own object.
            if (obj) {
                // first check if we have to modify a device/group/whatever
                const instanceId = getInstanceId(id);
                if (obj.type === "device" && instanceId in devices && devices[instanceId] != null) {
                    // if this device is in the device list, check for changed properties
                    const acc = devices[instanceId];
                    if (obj.common && obj.common.name !== acc.name) {
                        // the name has changed, notify the gateway
                        global_1.Global.log(`the device ${id} was renamed to "${obj.common.name}"`);
                        renameDevice(acc, obj.common.name);
                    }
                }
                else if (obj.type === "channel" && instanceId in groups && groups[instanceId] != null) {
                    // if this group is in the groups list, check for changed properties
                    const grp = groups[instanceId].group;
                    if (obj.common && obj.common.name !== grp.name) {
                        // the name has changed, notify the gateway
                        global_1.Global.log(`the group ${id} was renamed to "${obj.common.name}"`);
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
            for (const sub of customObjectSubscriptions.subscriptions.values()) {
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
    stateChange: (id, state) => __awaiter(this, void 0, void 0, function* () {
        if (state) {
            global_1.Global.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`, "debug");
        }
        else {
            global_1.Global.log(`{{blue}} state with id ${id} deleted`, "debug");
        }
        if (state && !state.ack && id.startsWith(adapter.namespace)) {
            // our own state was changed from within ioBroker, react to it
            const stateObj = objects[id];
            if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
                return;
            // get "official" value for the parent object
            const rootId = getRootId(id);
            if (rootId) {
                // get the ioBroker object
                const rootObj = objects[rootId];
                // for now: handle changes on a case by case basis
                // everything else is too complicated for now
                let val = state.val;
                // make sure we have whole numbers
                if (stateObj.common.type === "number") {
                    val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
                    if (global_1.Global.isdef(stateObj.common.min))
                        val = Math.max(stateObj.common.min, val);
                    if (global_1.Global.isdef(stateObj.common.max))
                        val = Math.min(stateObj.common.max, val);
                }
                // this will contain the serialized payload
                let serializedObj;
                // this will contain the url to be requested
                let url;
                switch (rootObj.native.type) {
                    case "group":
                        // read the instanceId and get a reference value
                        const group = groups[rootObj.native.instanceId].group;
                        // create a copy to modify
                        const newGroup = group.clone();
                        if (id.endsWith(".state")) {
                            newGroup.onOff = val;
                        }
                        else if (id.endsWith(".brightness")) {
                            newGroup.merge({
                                dimmer: val,
                                transitionTime: yield getTransitionDuration(group),
                            });
                        }
                        else if (id.endsWith(".activeScene")) {
                            // turn on and activate a scene
                            newGroup.merge({
                                onOff: true,
                                sceneId: val,
                            });
                        }
                        serializedObj = newGroup.serialize(group); // serialize with the old object as a reference
                        url = `${requestBase}${endpoints_1.default.groups}/${rootObj.native.instanceId}`;
                        break;
                    default:// accessory
                        // read the instanceId and get a reference value
                        const accessory = devices[rootObj.native.instanceId];
                        // create a copy to modify
                        const newAccessory = accessory.clone();
                        if (id.indexOf(".lightbulb.") > -1) {
                            // get the Light instance to modify
                            const light = newAccessory.lightList[0];
                            if (id.endsWith(".state")) {
                                light.onOff = val;
                            }
                            else if (id.endsWith(".brightness")) {
                                light.merge({
                                    dimmer: val,
                                    transitionTime: yield getTransitionDuration(accessory),
                                });
                            }
                            else if (id.endsWith(".color")) {
                                light.merge({
                                    colorX: val,
                                    colorY: 27000,
                                    transitionTime: yield getTransitionDuration(accessory),
                                });
                            }
                            else if (id.endsWith(".transitionDuration")) {
                                // TODO: check if we need to buffer this somehow
                                // for now just ack the change
                                yield adapter.$setState(id, state, true);
                                return;
                            }
                        }
                        serializedObj = newAccessory.serialize(accessory); // serialize with the old object as a reference
                        url = `${requestBase}${endpoints_1.default.devices}/${rootObj.native.instanceId}`;
                        break;
                }
                // If the serialized object contains no properties, we don't need to send anything
                if (!serializedObj || Object.keys(serializedObj).length === 0) {
                    global_1.Global.log("stateChange > empty object, not sending any payload", "debug");
                    yield adapter.$setState(id, state.val, true);
                    return;
                }
                let payload = JSON.stringify(serializedObj);
                global_1.Global.log("stateChange > sending payload: " + payload, "debug");
                payload = Buffer.from(payload);
                node_coap_client_1.CoapClient.request(url, "put", payload);
            }
        }
        else if (!state) {
            // TODO: find out what to do when states are deleted
        }
        // Custom subscriptions durchgehen, um die passenden Callbacks aufzurufen
        try {
            for (const sub of customStateSubscriptions.subscriptions.values()) {
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
    }),
    unload: (callback) => {
        // is called when adapter shuts down - callback has to be called under any circumstances!
        try {
            // stop pinging
            if (pingTimer != null)
                clearInterval(pingTimer);
            // stop all observers
            for (const url of observers) {
                node_coap_client_1.CoapClient.stopObserving(url);
            }
            // close all sockets
            node_coap_client_1.CoapClient.reset();
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
    return __awaiter(this, void 0, void 0, function* () {
        path = normalizeResourcePath(path);
        // check if we are already observing this resource
        const observerUrl = `${requestBase}${path}`;
        if (observers.indexOf(observerUrl) > -1)
            return;
        // start observing
        observers.push(observerUrl);
        return node_coap_client_1.CoapClient.observe(observerUrl, "get", callback);
    });
}
/**
 * Stops observing a resource
 * @param path The path of the resource (without requestBase)
 */
function stopObservingResource(path) {
    path = normalizeResourcePath(path);
    // remove observer
    const observerUrl = `${requestBase}${path}`;
    const index = observers.indexOf(observerUrl);
    if (index === -1)
        return;
    node_coap_client_1.CoapClient.stopObserving(observerUrl);
    observers.splice(index, 1);
}
/** Sets up an observer for all devices */
function observeDevices() {
    observeResource(endpoints_1.default.devices, coapCb_getAllDevices);
}
// gets called whenever "get /15001" updates
function coapCb_getAllDevices(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.code.toString() !== "2.05") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getAllDevices.`, "error");
            return;
        }
        const newDevices = parsePayload(response);
        global_1.Global.log(`got all devices: ${JSON.stringify(newDevices)}`);
        // get old keys as int array
        const oldKeys = Object.keys(devices).map(k => +k).sort();
        // get new keys as int array
        const newKeys = newDevices.sort();
        // translate that into added and removed devices
        const addedKeys = array_extensions_1.except(newKeys, oldKeys);
        global_1.Global.log(`adding devices with keys ${JSON.stringify(addedKeys)}`, "debug");
        const addDevices = addedKeys.map(id => {
            return observeResource(`${endpoints_1.default.devices}/${id}`, (resp) => coap_getDevice_cb(id, resp));
        });
        yield Promise.all(addDevices);
        const removedKeys = array_extensions_1.except(oldKeys, newKeys);
        global_1.Global.log(`removing devices with keys ${JSON.stringify(removedKeys)}`, "debug");
        removedKeys.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            if (id in devices) {
                // delete ioBroker device
                const deviceName = calcObjName(devices[id]);
                yield adapter.$deleteDevice(deviceName);
                // remove device from dictionary
                delete groups[id];
            }
            // remove observer
            stopObservingResource(`${endpoints_1.default.devices}/${id}`);
        }));
    });
}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(instanceId, response) {
    if (response.code.toString() !== "2.05") {
        global_1.Global.log(`unexpected response (${response.code.toString()}) to getDevice(${instanceId}).`, "error");
        return;
    }
    const result = parsePayload(response);
    // parse device info
    const accessory = new accessory_1.Accessory();
    accessory.parse(result);
    // remember the device object, so we can later use it as a reference for updates
    devices[instanceId] = accessory;
    // create ioBroker device
    extendDevice(accessory);
}
/** Sets up an observer for all groups */
function observeGroups() {
    observeResource(endpoints_1.default.groups, coapCb_getAllGroups);
}
// gets called whenever "get /15004" updates
function coapCb_getAllGroups(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.code.toString() !== "2.05") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getAllGroups.`, "error");
            return;
        }
        const newGroups = parsePayload(response);
        global_1.Global.log(`got all groups: ${JSON.stringify(newGroups)}`);
        // get old keys as int array
        const oldKeys = Object.keys(groups).map(k => +k).sort();
        // get new keys as int array
        const newKeys = newGroups.sort();
        // translate that into added and removed devices
        const addedKeys = array_extensions_1.except(newKeys, oldKeys);
        global_1.Global.log(`adding groups with keys ${JSON.stringify(addedKeys)}`, "debug");
        const addGroups = addedKeys.map(id => {
            return observeResource(`${endpoints_1.default.groups}/${id}`, (resp) => coap_getGroup_cb(id, resp));
        });
        yield Promise.all(addGroups);
        const removedKeys = array_extensions_1.except(oldKeys, newKeys);
        global_1.Global.log(`removing groups with keys ${JSON.stringify(removedKeys)}`, "debug");
        removedKeys.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            if (id in groups) {
                // delete ioBroker group
                const groupName = calcGroupName(groups[id].group);
                yield adapter.$deleteChannel(groupName);
                // remove group from dictionary
                delete groups[id];
            }
            // remove observer
            stopObservingResource(`${endpoints_1.default.groups}/${id}`);
        }));
    });
}
// gets called whenever "get /15004/<instanceId>" updates
function coap_getGroup_cb(instanceId, response) {
    // check response code
    switch (response.code.toString()) {
        case "2.05": break; // all good
        case "4.04":// not found
            // We know this group existed or we wouldn't have requested it
            // This means it has been deleted
            // TODO: Should we delete it here or where its being handled right now?
            return;
        default:
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getGroup(${instanceId}).`, "error");
            return;
    }
    const result = parsePayload(response);
    // parse group info
    const group = (new group_1.Group()).parse(result);
    // remember the group object, so we can later use it as a reference for updates
    let groupInfo;
    if (!(instanceId in groups)) {
        // if there's none, create one
        groups[instanceId] = {
            group: null,
            scenes: {},
        };
    }
    groupInfo = groups[instanceId];
    groupInfo.group = group;
    // create ioBroker states
    extendGroup(group);
    // and load scene information
    observeResource(`${endpoints_1.default.scenes}/${instanceId}`, (resp) => coap_getAllScenes_cb(instanceId, resp));
}
// gets called whenever "get /15005/<groupId>" updates
function coap_getAllScenes_cb(groupId, response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.code.toString() !== "2.05") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getAllScenes(${groupId}).`, "error");
            return;
        }
        const groupInfo = groups[groupId];
        const newScenes = parsePayload(response);
        global_1.Global.log(`got all scenes in group ${groupId}: ${JSON.stringify(newScenes)}`);
        // get old keys as int array
        const oldKeys = Object.keys(groupInfo.scenes).map(k => +k).sort();
        // get new keys as int array
        const newKeys = newScenes.sort();
        // translate that into added and removed devices
        const addedKeys = array_extensions_1.except(newKeys, oldKeys);
        global_1.Global.log(`adding scenes with keys ${JSON.stringify(addedKeys)} to group ${groupId}`, "debug");
        const addScenes = addedKeys.map(id => {
            return observeResource(`${endpoints_1.default.scenes}/${groupId}/${id}`, (resp) => coap_getScene_cb(groupId, id, resp));
        });
        yield Promise.all(addScenes);
        const removedKeys = array_extensions_1.except(oldKeys, newKeys);
        global_1.Global.log(`removing scenes with keys ${JSON.stringify(removedKeys)} from group ${groupId}`, "debug");
        removedKeys.forEach(id => {
            // remove scene from dictionary
            if (groupInfo.scenes.hasOwnProperty(id))
                delete groupInfo.scenes[id];
            // remove observer
            stopObservingResource(`${endpoints_1.default.scenes}/${groupId}/${id}`);
        });
        // Update the scene dropdown for the group
        updatePossibleScenes(groupInfo);
    });
}
// gets called whenever "get /15005/<groupId>/<instanceId>" updates
function coap_getScene_cb(groupId, instanceId, response) {
    // check response code
    switch (response.code.toString()) {
        case "2.05": break; // all good
        case "4.04":// not found
            // We know this scene existed or we wouldn't have requested it
            // This means it has been deleted
            // TODO: Should we delete it here or where its being handled right now?
            return;
        default:
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getScene(${groupId}, ${instanceId}).`, "error");
            return;
    }
    const result = parsePayload(response);
    // parse scene info
    const scene = (new scene_1.Scene()).parse(result);
    // remember the scene object, so we can later use it as a reference for updates
    groups[groupId].scenes[instanceId] = scene;
    // Update the scene dropdown for the group
    updatePossibleScenes(groups[groupId]);
}
/**
 * Returns the ioBroker id of the root object for the given state
 */
function getRootId(stateId) {
    const match = /^tradfri\.\d+\.\w+\-\d+/.exec(stateId);
    if (match)
        return match[0];
}
/**
 * Extracts the instance id from a given state or object id
 * @param id State or object id whose instance id should be extracted
 */
function getInstanceId(id) {
    const match = /^tradfri\.\d+\.\w+\-(\d+)/.exec(id);
    if (match)
        return +match[1];
}
/**
 * Determines the object ID under which the given accessory should be stored
 */
function calcObjId(accessory) {
    return `${adapter.namespace}.${calcObjName(accessory)}`;
}
/**
 * Determines the object name under which the given group accessory be stored,
 * excluding the adapter namespace
 */
function calcObjName(accessory) {
    const prefix = (() => {
        switch (accessory.type) {
            case accessory_1.AccessoryTypes.remote:
                return "RC";
            case accessory_1.AccessoryTypes.lightbulb:
                return "L";
            default:
                global_1.Global.log(`Unknown accessory type ${accessory.type}. Please send this info to the developer with a short description of the device!`, "warn");
                return "XYZ";
        }
    })();
    return `${prefix}-${accessory.instanceId}`;
}
/**
 * Determines the object ID under which the given group should be stored
 */
function calcGroupId(group) {
    return `${adapter.namespace}.${calcGroupName(group)}`;
}
/**
 * Determines the object name under which the given group should be stored,
 * excluding the adapter namespace
 */
function calcGroupName(group) {
    return `G-${group.instanceId}`;
}
/**
 * Determines the object ID under which the given scene should be stored
 */
function calcSceneId(scene) {
    return `${adapter.namespace}.${calcSceneName(scene)}`;
}
/**
 * Determines the object name under which the given scene should be stored,
 * excluding the adapter namespace
 */
function calcSceneName(scene) {
    return `S-${scene.instanceId}`;
}
/**
 * Returns the configured transition duration for an accessory or a group
 */
function getTransitionDuration(accessoryOrGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        let stateId;
        if (accessoryOrGroup instanceof accessory_1.Accessory) {
            switch (accessoryOrGroup.type) {
                case accessory_1.AccessoryTypes.lightbulb:
                    stateId = calcObjId(accessoryOrGroup) + ".lightbulb.transitionDuration";
            }
        }
        else if (accessoryOrGroup instanceof group_1.Group) {
            stateId = calcGroupId(accessoryOrGroup) + ".transitionDuration";
        }
        const ret = yield adapter.$getState(stateId);
        if (ret != null)
            return ret.val;
        return 0.5; // default
    });
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
    const objId = calcObjId(accessory);
    if (global_1.Global.isdef(objects[objId])) {
        // check if we need to edit the existing object
        const devObj = objects[objId];
        let changed = false;
        // update common part if neccessary
        const newCommon = accessoryToCommon(accessory);
        if (JSON.stringify(devObj.common) !== JSON.stringify(newCommon)) {
            // merge the common objects
            Object.assign(devObj.common, newCommon);
            changed = true;
        }
        const newNative = accessoryToNative(accessory);
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
        const stateObjs = object_polyfill_1.filter(objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
        // for each property try to update the value
        for (const [id, obj] of object_polyfill_1.entries(stateObjs)) {
            try {
                // Object could have a default value, find it
                const newValue = object_polyfill_1.dig(accessory, obj.native.path);
                adapter.setState(id, newValue, true);
            }
            catch (e) { }
        }
    }
    else {
        // create new object
        const devObj = {
            _id: objId,
            type: "device",
            common: accessoryToCommon(accessory),
            native: accessoryToNative(accessory),
        };
        adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        const stateObjs = {
            alive: {
                _id: `${objId}.alive`,
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
                _id: `${objId}.lastSeen`,
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
            stateObjs.lightbulb = {
                _id: `${objId}.lightbulb`,
                type: "channel",
                common: {
                    name: "Lightbulb",
                    role: "light",
                },
                native: {},
            };
            stateObjs["lightbulb.color"] = {
                _id: `${objId}.lightbulb.color`,
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
                    path: "lightList.[0].colorX",
                },
            };
            stateObjs["lightbulb.brightness"] = {
                _id: `${objId}.lightbulb.brightness`,
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
            stateObjs["lightbulb.state"] = {
                _id: `${objId}.lightbulb.state`,
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
            stateObjs["lightbulb.transitionDuration"] = {
                _id: `${objId}.lightbulb.transitionDuration`,
                type: "state",
                common: {
                    name: "Transition duration",
                    read: true,
                    write: true,
                    type: "number",
                    min: 0,
                    max: 100,
                    def: 0.5,
                    role: "light.dimmer",
                    desc: "Duration of a state change",
                    unit: "s",
                },
                native: {
                    path: "lightList.[0].transitionTime",
                },
            };
        }
        const createObjects = Object.keys(stateObjs)
            .map((key) => {
            const stateId = `${objId}.${key}`;
            const obj = stateObjs[key];
            let initialValue = null;
            if (global_1.Global.isdef(obj.native.path)) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(accessory, obj.native.path);
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
    const objId = calcGroupId(group);
    if (global_1.Global.isdef(objects[objId])) {
        // check if we need to edit the existing object
        const grpObj = objects[objId];
        let changed = false;
        // update common part if neccessary
        const newCommon = groupToCommon(group);
        if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
            // merge the common objects
            Object.assign(grpObj.common, newCommon);
            changed = true;
        }
        const newNative = groupToNative(group);
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
        const stateObjs = object_polyfill_1.filter(objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
        // for each property try to update the value
        for (const [id, obj] of object_polyfill_1.entries(stateObjs)) {
            try {
                // Object could have a default value, find it
                const newValue = object_polyfill_1.dig(group, obj.native.path);
                adapter.setState(id, newValue, true);
            }
            catch (e) { }
        }
    }
    else {
        // create new object
        const devObj = {
            _id: objId,
            type: "channel",
            common: groupToCommon(group),
            native: groupToNative(group),
        };
        adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        const stateObjs = {
            activeScene: {
                _id: `${objId}.activeScene`,
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
                _id: `${objId}.state`,
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
            transitionDuration: {
                _id: `${objId}.transitionDuration`,
                type: "state",
                common: {
                    name: "Transition duration",
                    read: false,
                    write: true,
                    type: "number",
                    min: 0,
                    max: 100,
                    def: 0,
                    role: "light.dimmer",
                    desc: "Duration for brightness changes of this group's lightbulbs",
                    unit: "s",
                },
                native: {
                    path: "transitionTime",
                },
            },
            brightness: {
                _id: `${objId}.brightness`,
                type: "state",
                common: {
                    name: "Brightness",
                    read: false,
                    write: true,
                    min: 0,
                    max: 254,
                    type: "number",
                    role: "light.dimmer",
                    desc: "Brightness of this group's lightbulbs",
                },
                native: {
                    path: "dimmer",
                },
            },
        };
        const createObjects = Object.keys(stateObjs)
            .map((key) => {
            const stateId = `${objId}.${key}`;
            const obj = stateObjs[key];
            let initialValue = null;
            if (global_1.Global.isdef(obj.native.path)) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(group, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return adapter.$createOwnStateEx(stateId, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
function updatePossibleScenes(groupInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const group = groupInfo.group;
        // if this group is not in the dictionary, don't do anything
        if (!(group.instanceId in groups))
            return;
        // find out which is the root object id
        const objId = calcGroupId(group);
        // scenes are stored under <objId>.activeScene
        const scenesId = `${objId}.activeScene`;
        // only extend that object if it exists already
        if (global_1.Global.isdef(objects[scenesId])) {
            global_1.Global.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);
            const activeSceneObj = objects[scenesId];
            const scenes = groupInfo.scenes;
            // map scene ids and names to the dropdown
            const states = object_polyfill_1.composeObject(Object.keys(scenes).map(id => [id, scenes[id].name]));
            const obj = yield adapter.$getObject(scenesId);
            obj.common.states = states;
            yield adapter.$setObject(scenesId, obj);
        }
    });
}
/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 */
function renameDevice(accessory, newName) {
    // create a copy to modify
    const newAccessory = accessory.clone();
    newAccessory.name = newName;
    // serialize with the old object as a reference
    const serializedObj = newAccessory.serialize(accessory);
    // If the serialized object contains no properties, we don't need to send anything
    if (!serializedObj || Object.keys(serializedObj).length === 0) {
        global_1.Global.log("renameDevice > empty object, not sending any payload", "debug");
        return;
    }
    // get the payload
    let payload = JSON.stringify(serializedObj);
    global_1.Global.log("renameDevice > sending payload: " + payload, "debug");
    payload = Buffer.from(payload);
    node_coap_client_1.CoapClient.request(`${requestBase}${endpoints_1.default.devices}/${accessory.instanceId}`, "put", payload);
}
/**
 * Renames a group
 * @param group The group to be renamed
 * @param newName The new name to be given to the group
 */
function renameGroup(group, newName) {
    // create a copy to modify
    const newGroup = group.clone();
    newGroup.name = newName;
    // serialize with the old object as a reference
    const serializedObj = newGroup.serialize(group);
    // If the serialized object contains no properties, we don't need to send anything
    if (!serializedObj || Object.keys(serializedObj).length === 0) {
        global_1.Global.log("renameGroup > empty object, not sending any payload", "debug");
        return;
    }
    // get the payload
    let payload = JSON.stringify(serializedObj);
    global_1.Global.log("renameDevice > sending payload: " + payload, "debug");
    payload = Buffer.from(payload);
    node_coap_client_1.CoapClient.request(`${requestBase}${endpoints_1.default.groups}/${group.instanceId}`, "put", payload);
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
    const newCounter = (++customStateSubscriptions.counter);
    const id = "" + newCounter;
    customStateSubscriptions.subscriptions.set(id, { pattern, callback });
    return id;
}
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id) {
    if (customStateSubscriptions.subscriptions.has(id)) {
        customStateSubscriptions.subscriptions.delete(id);
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
    const newCounter = (++customObjectSubscriptions.counter);
    const id = "" + newCounter;
    customObjectSubscriptions.subscriptions.set(id, { pattern, callback });
    return id;
}
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id) {
    if (customObjectSubscriptions.subscriptions.has(id)) {
        customObjectSubscriptions.subscriptions.delete(id);
    }
}
function parsePayload(response) {
    switch (response.format) {
        case 0: // text/plain
        case null:// assume text/plain
            return response.payload.toString("utf-8");
        case 50:// application/json
            const json = response.payload.toString("utf-8");
            return JSON.parse(json);
        default:
            // dunno how to parse this
            global_1.Global.log(`unknown CoAP response format ${response.format}`, "warn");
            return response.payload;
    }
}
// Connection check
let pingTimer;
let connectionAlive = false;
let pingFails = 0;
let resetAttempts = 0;
function pingThread() {
    return __awaiter(this, void 0, void 0, function* () {
        const oldValue = connectionAlive;
        connectionAlive = yield node_coap_client_1.CoapClient.ping(requestBase);
        global_1.Global.log(`ping ${connectionAlive ? "" : "un"}successful...`, "debug");
        yield adapter.$setStateChanged("info.connection", connectionAlive, true);
        // see if the connection state has changed
        if (connectionAlive) {
            pingFails = 0;
            if (!oldValue) {
                // connection is now alive again
                global_1.Global.log("Connection to gateway reestablished", "info");
                // TODO: send buffered messages
            }
        }
        else {
            if (oldValue) {
                // connection is now dead
                global_1.Global.log("Lost connection to gateway", "warn");
                // TODO: buffer messages
            }
            // Try to fix stuff by resetting the connection after a few failed pings
            pingFails++;
            if (pingFails >= 3) {
                if (resetAttempts < 3) {
                    resetAttempts++;
                    global_1.Global.log(`3 consecutive pings failed, resetting connection (attempt #${resetAttempts})...`, "warn");
                    pingFails = 0;
                    node_coap_client_1.CoapClient.reset();
                }
                else {
                    // not sure what to do here, try restarting the adapter
                    global_1.Global.log(`3 consecutive reset attempts failed, restarting the adapter`, "warn");
                    setTimeout(() => {
                        process.exit(1);
                    }, 1000);
                }
            }
        }
    });
}
// Unbehandelte Fehler tracen
function getMessage(err) {
    // Irgendwo gibt es wohl einen Fehler ohne Message
    if (err == null)
        return "undefined";
    if (typeof err === "string")
        return err;
    if (err.message != null)
        return err.message;
    if (err.name != null)
        return err.name;
    return err.toString();
}
process.on("unhandledRejection", (err) => {
    adapter.log.error("unhandled promise rejection: " + getMessage(err));
    if (err.stack != null)
        adapter.log.error("> stack: " + err.stack);
});
process.on("uncaughtException", (err) => {
    adapter.log.error("unhandled exception:" + getMessage(err));
    if (err.stack != null)
        adapter.log.error("> stack: " + err.stack);
    process.exit(1);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiJEOi9pb0Jyb2tlci50cmFkZnJpL3NyYy8iLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDJDQUEyQzs7Ozs7Ozs7OztBQUUzQyx5QkFBeUI7QUFDekIsMkNBQTJDO0FBQzNDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBRTVCLHNCQUFzQjtBQUN0Qix1REFBb0U7QUFDcEUsZ0RBQTZDO0FBQzdDLDZEQUFnRDtBQUNoRCx5Q0FBNEQ7QUFDNUQsMkRBQW9HO0FBQ3BHLDZDQUFzQztBQUN0QywrQ0FBNEM7QUFFNUMsbUJBQW1CO0FBQ25CLGdEQUE2RDtBQUM3RCx3Q0FBcUM7QUFHckMsd0NBQXFDO0FBRXJDLHNCQUFzQjtBQUN0Qix1Q0FBZ0M7QUFVaEMsTUFBTSx3QkFBd0IsR0FHMUI7SUFDRixhQUFhLEVBQUUsSUFBSSxHQUFHLEVBQUU7SUFDeEIsT0FBTyxFQUFFLENBQUM7Q0FDVixDQUFDO0FBQ0gsTUFBTSx5QkFBeUIsR0FHM0I7SUFDRixhQUFhLEVBQUUsSUFBSSxHQUFHLEVBQUU7SUFDeEIsT0FBTyxFQUFFLENBQUM7Q0FDVixDQUFDO0FBRUgsK0JBQStCO0FBQy9CLE1BQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQztBQUMvQiw4QkFBOEI7QUFDOUIsTUFBTSxPQUFPLEdBQThCLEVBQUUsQ0FBQztBQU05QyxNQUFNLE1BQU0sR0FBOEIsRUFBRSxDQUFDO0FBQzdDLGlDQUFpQztBQUNqQyxNQUFNLE9BQU8sR0FBb0MsRUFBRSxDQUFDO0FBRXBELDJCQUEyQjtBQUMzQixJQUFJLFdBQW1CLENBQUM7QUFFeEIsMkJBQTJCO0FBQzNCLElBQUksT0FBTyxHQUFvQixlQUFLLENBQUMsT0FBTyxDQUFDO0lBQzVDLElBQUksRUFBRSxTQUFTO0lBRWYsbURBQW1EO0lBQ25ELEtBQUssRUFBRTtRQUVOLGdFQUFnRTtRQUNoRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTTtl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