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
const coap_payload_1 = require("./lib/coap-payload");
const global_1 = require("./lib/global");
const object_polyfill_1 = require("./lib/object-polyfill");
const promises_1 = require("./lib/promises");
// Datentypen laden
const accessory_1 = require("./ipso/accessory");
const group_1 = require("./ipso/group");
const scene_1 = require("./ipso/scene");
const virtual_group_1 = require("./lib/virtual-group");
// Adapter-Utils laden
const utils_1 = require("./lib/utils");
// Adapter-Module laden
const custom_subscriptions_1 = require("./modules/custom-subscriptions");
const gateway_1 = require("./modules/gateway");
const groups_1 = require("./modules/groups");
const message_1 = require("./modules/message");
const operations_1 = require("./modules/operations");
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
        // watch own states
        adapter.subscribeStates(`${adapter.namespace}.*`);
        adapter.subscribeObjects(`${adapter.namespace}.*`);
        // add special watch for lightbulb states, so we can later sync the group states
        custom_subscriptions_1.subscribeStates(/L\-\d+\.lightbulb\./, syncGroupsWithState);
        // initialize CoAP client
        const hostname = adapter.config.host.toLowerCase();
        node_coap_client_1.CoapClient.setSecurityParams(hostname, {
            psk: { "Client_identity": adapter.config.securityCode },
        });
        gateway_1.gateway.requestBase = `coaps://${hostname}:5684/`;
        // Try a few times to setup a working connection
        const maxTries = 3;
        for (let i = 1; i <= maxTries; i++) {
            if (yield node_coap_client_1.CoapClient.tryToConnect(gateway_1.gateway.requestBase)) {
                break; // it worked
            }
            else if (i < maxTries) {
                global_1.Global.log(`Could not connect to gateway, try #${i}`, "warn");
                yield promises_1.wait(1000);
            }
            else if (i === maxTries) {
                // no working connection
                global_1.Global.log(`Could not connect to the gateway ${gateway_1.gateway.requestBase} after ${maxTries} tries!`, "error");
                global_1.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
                return;
            }
        }
        yield adapter.$setState("info.connection", true, true);
        connectionAlive = true;
        pingTimer = setInterval(pingThread, 10000);
        loadVirtualGroups();
        // TODO: load known devices from ioBroker into <devices> & <objects>
        observeAll();
    }),
    // Handle sendTo-Messages
    message: message_1.onMessage,
    objectChange: (id, obj) => {
        global_1.Global.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, "debug");
        if (id.startsWith(adapter.namespace)) {
            // this is our own object.
            if (obj) {
                // first check if we have to modify a device/group/whatever
                const instanceId = getInstanceId(id);
                if (obj.type === "device" && instanceId in gateway_1.gateway.devices && gateway_1.gateway.devices[instanceId] != null) {
                    // if this device is in the device list, check for changed properties
                    const acc = gateway_1.gateway.devices[instanceId];
                    if (obj.common && obj.common.name !== acc.name) {
                        // the name has changed, notify the gateway
                        global_1.Global.log(`the device ${id} was renamed to "${obj.common.name}"`);
                        operations_1.renameDevice(acc, obj.common.name);
                    }
                }
                else if (obj.type === "channel" && instanceId in gateway_1.gateway.groups && gateway_1.gateway.groups[instanceId] != null) {
                    // if this group is in the groups list, check for changed properties
                    const grp = gateway_1.gateway.groups[instanceId].group;
                    if (obj.common && obj.common.name !== grp.name) {
                        // the name has changed, notify the gateway
                        global_1.Global.log(`the group ${id} was renamed to "${obj.common.name}"`);
                        operations_1.renameGroup(grp, obj.common.name);
                    }
                }
                // remember the object
                gateway_1.gateway.objects[id] = obj;
            }
            else {
                // object deleted, forget it
                if (id in gateway_1.gateway.objects)
                    delete gateway_1.gateway.objects[id];
            }
        }
        // apply additional subscriptions we've defined
        custom_subscriptions_1.applyCustomObjectSubscriptions(id, obj);
    },
    stateChange: (id, state) => __awaiter(this, void 0, void 0, function* () {
        if (state) {
            global_1.Global.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`, "debug");
        }
        else {
            global_1.Global.log(`{{blue}} state with id ${id} deleted`, "debug");
        }
        if (dead) {
            global_1.Global.log("The connection to the gateway is dead.", "error");
            global_1.Global.log("Cannot send changes.", "error");
            global_1.Global.log("Please restart the adapter!", "error");
            return;
        }
        // apply additional subscriptions we've defined
        custom_subscriptions_1.applyCustomStateSubscriptions(id, state);
        // Eigene Handling-Logik zum Schluss, damit wir return benutzen können
        if (state && !state.ack && id.startsWith(adapter.namespace)) {
            // our own state was changed from within ioBroker, react to it
            const stateObj = gateway_1.gateway.objects[id];
            if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
                return;
            // get "official" value for the parent object
            const rootId = getRootId(id);
            if (rootId) {
                // get the ioBroker object
                const rootObj = gateway_1.gateway.objects[rootId];
                // for now: handle changes on a case by case basis
                // everything else is too complicated for now
                let val = state.val;
                // make sure we have whole numbers
                if (stateObj.common.type === "number") {
                    val = Math.round(val); // TODO: check if there are situations where decimal numbers are allowed
                    if (stateObj.common.min != null)
                        val = Math.max(stateObj.common.min, val);
                    if (stateObj.common.max != null)
                        val = Math.min(stateObj.common.max, val);
                }
                switch (rootObj.native.type) {
                    case "group": {
                        // read the instanceId and get a reference value
                        const group = gateway_1.gateway.groups[rootObj.native.instanceId].group;
                        // if the change was acknowledged, update the state later
                        let wasAcked;
                        if (id.endsWith(".state")) {
                            wasAcked = !(yield operations_1.operateGroup(group, {
                                onOff: val,
                            }));
                        }
                        else if (id.endsWith(".brightness")) {
                            wasAcked = !(yield operations_1.operateGroup(group, {
                                dimmer: val,
                                transitionTime: yield getTransitionDuration(group),
                            }));
                        }
                        else if (id.endsWith(".activeScene")) {
                            // turn on and activate a scene
                            wasAcked = !(yield operations_1.operateGroup(group, {
                                onOff: true,
                                sceneId: val,
                            }));
                        }
                        else if (/\.(colorTemperature|color|hue|saturation)$/.test(id)) {
                            // color change is only supported manually, so we operate
                            // the virtual state of this group
                            yield operations_1.operateVirtualGroup(group, {
                                [id.substr(id.lastIndexOf(".") + 1)]: val,
                                transitionTime: yield getTransitionDuration(group),
                            });
                            wasAcked = true;
                        }
                        else if (id.endsWith(".transitionDuration")) {
                            // this is part of another operation, just ack the state
                            wasAcked = true;
                        }
                        // ack the state if neccessary and return
                        if (wasAcked)
                            adapter.$setState(id, state, true);
                        return;
                    }
                    case "virtual group": {
                        // find the virtual group instance
                        const vGroup = gateway_1.gateway.virtualGroups[rootObj.native.instanceId];
                        let operation;
                        if (id.endsWith(".state")) {
                            operation = {
                                onOff: val,
                            };
                        }
                        else if (id.endsWith(".brightness")) {
                            operation = {
                                dimmer: val,
                                transitionTime: yield getTransitionDuration(vGroup),
                            };
                        }
                        else if (/\.(colorTemperature|color|hue|saturation)$/.test(id)) {
                            operation = {
                                [id.substr(id.lastIndexOf(".") + 1)]: val,
                                transitionTime: yield getTransitionDuration(vGroup),
                            };
                        }
                        else if (id.endsWith(".transitionDuration")) {
                            // No operation here, since this is part of another one
                        }
                        // update all lightbulbs in this group
                        if (operation != null) {
                            operations_1.operateVirtualGroup(vGroup, operation);
                        }
                        // and ack the state change
                        adapter.$setState(id, state, true);
                        return;
                    }
                    default: {
                        if (id.indexOf(".lightbulb.") > -1) {
                            // read the instanceId and get a reference value
                            const accessory = gateway_1.gateway.devices[rootObj.native.instanceId];
                            const light = accessory.lightList[0];
                            // if the change was acknowledged, update the state later
                            let wasAcked;
                            // operate the lights depending on the set state
                            // if no request was sent, we can ack the state immediately
                            if (id.endsWith(".state")) {
                                wasAcked = !(yield operations_1.operateLight(accessory, {
                                    onOff: val,
                                }));
                            }
                            else if (id.endsWith(".brightness")) {
                                wasAcked = !(yield operations_1.operateLight(accessory, {
                                    dimmer: val,
                                    transitionTime: yield getTransitionDuration(accessory),
                                }));
                            }
                            else if (id.endsWith(".color")) {
                                // we need to differentiate here, because some ppl
                                // might already have "color" states for white spectrum bulbs
                                // in the future, we create different states for white and RGB bulbs
                                if (light.spectrum === "rgb") {
                                    wasAcked = !(yield operations_1.operateLight(accessory, {
                                        color: val,
                                        transitionTime: yield getTransitionDuration(accessory),
                                    }));
                                }
                                else if (light.spectrum === "white") {
                                    wasAcked = !(yield operations_1.operateLight(accessory, {
                                        colorTemperature: val,
                                        transitionTime: yield getTransitionDuration(accessory),
                                    }));
                                }
                            }
                            else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
                                wasAcked = !(yield operations_1.operateLight(accessory, {
                                    [id.substr(id.lastIndexOf(".") + 1)]: val,
                                    transitionTime: yield getTransitionDuration(accessory),
                                }));
                            }
                            else if (id.endsWith(".transitionDuration")) {
                                // this is part of another operation, just ack the state
                                wasAcked = true;
                            }
                            // ack the state if neccessary and return
                            if (wasAcked)
                                adapter.$setState(id, state, true);
                            return;
                        }
                    }
                }
            }
        }
        else if (!state) {
            // TODO: find out what to do when states are deleted
        }
    }),
    unload: (callback) => {
        // is called when adapter shuts down - callback has to be called under any circumstances!
        try {
            // stop pinging
            if (pingTimer != null)
                clearInterval(pingTimer);
            // stop all observers
            for (const url of gateway_1.gateway.observers) {
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
// gets called when a lightbulb state gets updated
// we use this to sync group states because those are not advertised by the gateway
function syncGroupsWithState(id, state) {
    if (state && state.ack) {
        const instanceId = getInstanceId(id);
        if (instanceId in gateway_1.gateway.devices && gateway_1.gateway.devices[instanceId] != null) {
            const accessory = gateway_1.gateway.devices[instanceId];
            groups_1.updateMultipleGroupStates(accessory, id);
        }
    }
}
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
        const observerUrl = `${gateway_1.gateway.requestBase}${path}`;
        if (gateway_1.gateway.observers.indexOf(observerUrl) > -1)
            return;
        // start observing
        gateway_1.gateway.observers.push(observerUrl);
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
    const observerUrl = `${gateway_1.gateway.requestBase}${path}`;
    const index = gateway_1.gateway.observers.indexOf(observerUrl);
    if (index === -1)
        return;
    node_coap_client_1.CoapClient.stopObserving(observerUrl);
    gateway_1.gateway.observers.splice(index, 1);
}
/**
 * Clears the list of gw.observers after a network reset
 */
function clearObservers() {
    gateway_1.gateway.observers.splice(0, gateway_1.gateway.observers.length);
}
function observeAll() {
    observeDevices();
    observeGroups();
}
/** Sets up an observer for all devices */
function observeDevices() {
    observeResource(endpoints_1.endpoints.devices, coapCb_getAllDevices);
}
// gets called whenever "get /15001" updates
function coapCb_getAllDevices(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.code.toString() !== "2.05") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getAllDevices.`, "error");
            return;
        }
        const newDevices = coap_payload_1.parsePayload(response);
        global_1.Global.log(`got all devices: ${JSON.stringify(newDevices)}`);
        // get old keys as int array
        const oldKeys = Object.keys(gateway_1.gateway.devices).map(k => +k).sort();
        // get new keys as int array
        const newKeys = newDevices.sort();
        // translate that into added and removed devices
        const addedKeys = array_extensions_1.except(newKeys, oldKeys);
        global_1.Global.log(`adding devices with keys ${JSON.stringify(addedKeys)}`, "debug");
        const observeDevicePromises = newKeys.map(id => {
            return observeResource(`${endpoints_1.endpoints.devices}/${id}`, (resp) => coap_getDevice_cb(id, resp));
        });
        yield Promise.all(observeDevicePromises);
        const removedKeys = array_extensions_1.except(oldKeys, newKeys);
        global_1.Global.log(`removing devices with keys ${JSON.stringify(removedKeys)}`, "debug");
        removedKeys.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            if (id in gateway_1.gateway.devices) {
                // delete ioBroker device
                const deviceName = calcObjName(gateway_1.gateway.devices[id]);
                yield adapter.$deleteDevice(deviceName);
                // remove device from dictionary
                delete gateway_1.gateway.groups[id];
            }
            // remove observer
            stopObservingResource(`${endpoints_1.endpoints.devices}/${id}`);
        }));
    });
}
// gets called whenever "get /15001/<instanceId>" updates
function coap_getDevice_cb(instanceId, response) {
    if (response.code.toString() !== "2.05") {
        global_1.Global.log(`unexpected response (${response.code.toString()}) to getDevice(${instanceId}).`, "error");
        return;
    }
    const result = coap_payload_1.parsePayload(response);
    // parse device info
    const accessory = new accessory_1.Accessory().parse(result).createProxy();
    // remember the device object, so we can later use it as a reference for updates
    gateway_1.gateway.devices[instanceId] = accessory;
    // create ioBroker device
    extendDevice(accessory);
}
/** Sets up an observer for all groups */
function observeGroups() {
    observeResource(endpoints_1.endpoints.groups, coapCb_getAllGroups);
}
// gets called whenever "get /15004" updates
function coapCb_getAllGroups(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.code.toString() !== "2.05") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getAllGroups.`, "error");
            return;
        }
        const newGroups = coap_payload_1.parsePayload(response);
        global_1.Global.log(`got all groups: ${JSON.stringify(newGroups)}`);
        // get old keys as int array
        const oldKeys = Object.keys(gateway_1.gateway.groups).map(k => +k).sort();
        // get new keys as int array
        const newKeys = newGroups.sort();
        // translate that into added and removed devices
        const addedKeys = array_extensions_1.except(newKeys, oldKeys);
        global_1.Global.log(`adding groups with keys ${JSON.stringify(addedKeys)}`, "debug");
        const observeGroupPromises = newKeys.map(id => {
            return observeResource(`${endpoints_1.endpoints.groups}/${id}`, (resp) => coap_getGroup_cb(id, resp));
        });
        yield Promise.all(observeGroupPromises);
        const removedKeys = array_extensions_1.except(oldKeys, newKeys);
        global_1.Global.log(`removing groups with keys ${JSON.stringify(removedKeys)}`, "debug");
        removedKeys.forEach((id) => __awaiter(this, void 0, void 0, function* () {
            if (id in gateway_1.gateway.groups) {
                // delete ioBroker group
                const groupName = groups_1.calcGroupName(gateway_1.gateway.groups[id].group);
                yield adapter.$deleteChannel(groupName);
                // remove group from dictionary
                delete gateway_1.gateway.groups[id];
            }
            // remove observer
            stopObservingResource(`${endpoints_1.endpoints.groups}/${id}`);
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
    const result = coap_payload_1.parsePayload(response);
    // parse group info
    const group = (new group_1.Group()).parse(result).createProxy();
    // remember the group object, so we can later use it as a reference for updates
    let groupInfo;
    if (!(instanceId in gateway_1.gateway.groups)) {
        // if there's none, create one
        gateway_1.gateway.groups[instanceId] = {
            group: null,
            scenes: {},
        };
    }
    groupInfo = gateway_1.gateway.groups[instanceId];
    groupInfo.group = group;
    // create ioBroker states
    groups_1.extendGroup(group);
    // clean up any states that might be incorrectly defined
    groups_1.updateGroupStates(group);
    // and load scene information
    observeResource(`${endpoints_1.endpoints.scenes}/${instanceId}`, (resp) => coap_getAllScenes_cb(instanceId, resp));
}
// gets called whenever "get /15005/<groupId>" updates
function coap_getAllScenes_cb(groupId, response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (response.code.toString() !== "2.05") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getAllScenes(${groupId}).`, "error");
            return;
        }
        const groupInfo = gateway_1.gateway.groups[groupId];
        const newScenes = coap_payload_1.parsePayload(response);
        global_1.Global.log(`got all scenes in group ${groupId}: ${JSON.stringify(newScenes)}`);
        // get old keys as int array
        const oldKeys = Object.keys(groupInfo.scenes).map(k => +k).sort();
        // get new keys as int array
        const newKeys = newScenes.sort();
        // translate that into added and removed devices
        const addedKeys = array_extensions_1.except(newKeys, oldKeys);
        global_1.Global.log(`adding scenes with keys ${JSON.stringify(addedKeys)} to group ${groupId}`, "debug");
        const observeScenePromises = newKeys.map(id => {
            return observeResource(`${endpoints_1.endpoints.scenes}/${groupId}/${id}`, (resp) => coap_getScene_cb(groupId, id, resp));
        });
        yield Promise.all(observeScenePromises);
        const removedKeys = array_extensions_1.except(oldKeys, newKeys);
        global_1.Global.log(`removing scenes with keys ${JSON.stringify(removedKeys)} from group ${groupId}`, "debug");
        removedKeys.forEach(id => {
            // remove scene from dictionary
            if (groupInfo.scenes.hasOwnProperty(id))
                delete groupInfo.scenes[id];
            // remove observer
            stopObservingResource(`${endpoints_1.endpoints.scenes}/${groupId}/${id}`);
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
    const result = coap_payload_1.parsePayload(response);
    // parse scene info
    const scene = (new scene_1.Scene()).parse(result).createProxy();
    // remember the scene object, so we can later use it as a reference for updates
    gateway_1.gateway.groups[groupId].scenes[instanceId] = scene;
    // Update the scene dropdown for the group
    updatePossibleScenes(gateway_1.gateway.groups[groupId]);
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
    let prefix;
    switch (accessory.type) {
        case accessory_1.AccessoryTypes.remote:
            prefix = "RC";
            break;
        case accessory_1.AccessoryTypes.lightbulb:
            prefix = "L";
            break;
        default:
            global_1.Global.log(`Unknown accessory type ${accessory.type}. Please send this info to the developer with a short description of the device!`, "warn");
            prefix = "XYZ";
            break;
    }
    return `${prefix}-${accessory.instanceId}`;
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
        else if (accessoryOrGroup instanceof group_1.Group || accessoryOrGroup instanceof virtual_group_1.VirtualGroup) {
            stateId = groups_1.calcGroupId(accessoryOrGroup) + ".transitionDuration";
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
    if (objId in gateway_1.gateway.objects) {
        // check if we need to edit the existing object
        const devObj = gateway_1.gateway.objects[objId];
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
        const stateObjs = object_polyfill_1.filter(gateway_1.gateway.objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
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
            let channelName;
            let spectrum = "none";
            if (accessory.lightList != null && accessory.lightList.length > 0) {
                spectrum = accessory.lightList[0].spectrum;
            }
            if (spectrum === "none") {
                channelName = "Lightbulb";
            }
            else if (spectrum === "white") {
                channelName = "Lightbulb (white spectrum)";
            }
            else if (spectrum === "rgb") {
                channelName = "RGB Lightbulb";
            }
            // obj.lightbulb should be a channel
            stateObjs.lightbulb = {
                _id: `${objId}.lightbulb`,
                type: "channel",
                common: {
                    name: channelName,
                    role: "light",
                },
                native: {
                    spectrum: spectrum,
                },
            };
            if (spectrum === "white") {
                stateObjs["lightbulb.colorTemperature"] = {
                    _id: `${objId}.lightbulb.colorTemperature`,
                    type: "state",
                    common: {
                        name: "Color temperature",
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
                        path: "lightList.[0].colorTemperature",
                    },
                };
            }
            else if (spectrum === "rgb") {
                stateObjs["lightbulb.color"] = {
                    _id: `${objId}.lightbulb.color`,
                    type: "state",
                    common: {
                        name: "RGB color",
                        read: true,
                        write: true,
                        type: "string",
                        role: "level.color",
                        desc: "6-digit RGB hex string",
                    },
                    native: {
                        path: "lightList.[0].color",
                    },
                };
                stateObjs["lightbulb.hue"] = {
                    _id: `${objId}.lightbulb.hue`,
                    type: "state",
                    common: {
                        name: "Hue",
                        read: true,
                        write: true,
                        min: 0,
                        max: 360,
                        unit: "°",
                        type: "number",
                        role: "level.color.hue",
                    },
                    native: {
                        path: "lightList.[0].hue",
                    },
                };
                stateObjs["lightbulb.saturation"] = {
                    _id: `${objId}.lightbulb.saturation`,
                    type: "state",
                    common: {
                        name: "Saturation",
                        read: true,
                        write: true,
                        min: 0,
                        max: 100,
                        unit: "%",
                        type: "number",
                        role: "level.color.saturation",
                    },
                    native: {
                        path: "lightList.[0].saturation",
                    },
                };
            }
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
            const obj = stateObjs[key];
            let initialValue = null;
            if (obj.native.path != null) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(accessory, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return adapter.$createOwnStateEx(obj._id, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
function updatePossibleScenes(groupInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const group = groupInfo.group;
        // if this group is not in the dictionary, don't do anything
        if (!(group.instanceId in gateway_1.gateway.groups))
            return;
        // find out which is the root object id
        const objId = groups_1.calcGroupId(group);
        // scenes are stored under <objId>.activeScene
        const scenesId = `${objId}.activeScene`;
        // only extend that object if it exists already
        if (scenesId in gateway_1.gateway.objects) {
            global_1.Global.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);
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
 * Loads defined virtual groups from the ioBroker objects DB
 */
function loadVirtualGroups() {
    return __awaiter(this, void 0, void 0, function* () {
        // find all defined virtual groups
        const iobObjects = yield global_1.Global.$$(`${adapter.namespace}.VG-*`, "channel");
        const groupObjects = object_polyfill_1.values(iobObjects).filter(g => {
            return g.native &&
                g.native.instanceId != null &&
                g.native.type === "virtual group";
        });
        // load them into the virtualGroups dict
        Object.assign(gateway_1.gateway.virtualGroups, object_polyfill_1.composeObject(groupObjects.map(g => {
            const id = g.native.instanceId;
            const deviceIDs = g.native.deviceIDs.map(d => parseInt(d, 10));
            const ret = new virtual_group_1.VirtualGroup(id);
            ret.deviceIDs = deviceIDs;
            ret.name = g.common.name;
            return [`${id}`, ret];
        })));
        // remember the actual objects
        for (const obj of object_polyfill_1.values(gateway_1.gateway.virtualGroups)) {
            const id = groups_1.calcGroupId(obj);
            gateway_1.gateway.objects[id] = iobObjects[id];
            // also remember all states
            const stateObjs = yield global_1.Global.$$(`${id}.*`, "state");
            for (const [sid, sobj] of object_polyfill_1.entries(stateObjs)) {
                gateway_1.gateway.objects[sid] = sobj;
            }
        }
    });
}
// Connection check
let pingTimer;
let connectionAlive = false;
let pingFails = 0;
let resetAttempts = 0;
let dead = false;
function pingThread() {
    return __awaiter(this, void 0, void 0, function* () {
        const oldValue = connectionAlive;
        connectionAlive = yield node_coap_client_1.CoapClient.ping(gateway_1.gateway.requestBase);
        global_1.Global.log(`ping ${connectionAlive ? "" : "un"}successful...`, "debug");
        yield adapter.$setStateChanged("info.connection", connectionAlive, true);
        // see if the connection state has changed
        if (connectionAlive) {
            pingFails = 0;
            if (!oldValue) {
                // connection is now alive again
                global_1.Global.log("Connection to gateway reestablished", "info");
                // restart observing if neccessary
                if (gateway_1.gateway.observers.length === 0)
                    observeAll();
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
                    // after a reset, our observers references are orphaned, clear them.
                    clearObservers();
                }
                else {
                    // not sure what to do here, try restarting the adapter
                    global_1.Global.log(`Three consecutive reset attempts failed!`, "error");
                    global_1.Global.log(`Please restart the adapter manually!`, "error");
                    clearTimeout(pingTimer);
                    dead = true;
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
