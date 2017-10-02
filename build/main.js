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
    subscriptions: {},
    counter: 0,
};
const customObjectSubscriptions = {
    subscriptions: {},
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
            for (const sub of object_polyfill_1.values(customObjectSubscriptions.subscriptions)) {
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
                    default:
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
            for (const sub of object_polyfill_1.values(customStateSubscriptions.subscriptions)) {
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
        case "4.04":
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
        case "4.04":
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
                global_1.Global.log("unknown accessory type " + accessory.type);
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
    customStateSubscriptions.subscriptions[id] = { pattern, callback };
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
    const newCounter = (++customObjectSubscriptions.counter);
    const id = "" + newCounter;
    customObjectSubscriptions.subscriptions[id] = { pattern, callback };
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
                global_1.Global.log("3 consecutive pings failed, resetting connection...", "warn");
                node_coap_client_1.CoapClient.reset();
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
//# sourceMappingURL=main.js.map