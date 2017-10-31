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
const colors_1 = require("./lib/colors");
const fix_objects_1 = require("./lib/fix-objects");
const iobroker_objects_1 = require("./lib/iobroker-objects");
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
        // redirect console output
        // console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
        // console.error = (msg) => adapter.log.error("STDERR > " + msg);
        global_1.Global.log(`startfile = ${process.argv[1]}`);
        // Fix our adapter objects to repair incompatibilities between versions
        yield fix_objects_1.ensureInstanceObjects();
        yield fix_objects_1.fixAdapterObjects();
        // watch own states
        adapter.subscribeStates(`${adapter.namespace}.*`);
        adapter.subscribeObjects(`${adapter.namespace}.*`);
        // add special watch for lightbulb states, so we can later sync the group states
        custom_subscriptions_1.subscribeStates(/L\-\d+\.lightbulb\./, groups_1.syncGroupsWithState);
        const hostname = adapter.config.host.toLowerCase();
        gateway_1.gateway.requestBase = `coaps://${hostname}:5684/`;
        // TODO: make this more elegant when I have the time
        // we're reconnecting a bit too much
        // first, check try to connect with the security code
        global_1.Global.log("trying to connect with the security code", "debug");
        if (!(yield connect(hostname, "Client_identity", adapter.config.securityCode))) {
            // that didn't work, so the code is wrong
            return;
        }
        // now, if we have a stored identity, try to connect with that one
        const identity = yield adapter.$getState("info.identity");
        const identityObj = yield adapter.$getObject("info.identity");
        let needsAuthentication;
        if (identity == null || !("psk" in identityObj.native) || typeof identityObj.native.psk !== "string" || identityObj.native.psk.length === 0) {
            global_1.Global.log("no identity stored, creating a new one", "debug");
            needsAuthentication = true;
        }
        else if (!(yield connect(hostname, identity.val, identityObj.native.psk))) {
            global_1.Global.log("stored identity has expired, creating a new one", "debug");
            // either there was no stored identity, or the current one is expired,
            // so we need to get a new one
            // delete the old one first
            yield adapter.$setState("info.identity", "", true);
            if ("psk" in identityObj.native) {
                delete identityObj.native.psk;
                yield adapter.$setObject("info.identity", identityObj);
            }
            needsAuthentication = true;
            // therefore, reconnect with the working security code
            yield connect(hostname, "Client_identity", adapter.config.securityCode);
        }
        if (needsAuthentication) {
            const authResult = yield authenticate();
            if (authResult == null) {
                global_1.Global.log("authentication failed", "error");
                return;
            }
            global_1.Global.log(`reconnecting with the new identity`, "debug");
            if (!(yield connect(hostname, authResult.identity, authResult.psk))) {
                global_1.Global.log("connection with fresh identity failed", "error");
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
                const instanceId = iobroker_objects_1.getInstanceId(id);
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
            const rootId = iobroker_objects_1.getRootId(id);
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
                        else if (id.endsWith(".color")) {
                            val = colors_1.normalizeHexColor(val);
                            if (val != null) {
                                state.val = val;
                                yield operations_1.operateVirtualGroup(group, {
                                    color: val,
                                    transitionTime: yield getTransitionDuration(group),
                                });
                                wasAcked = true;
                            }
                        }
                        else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
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
                        let wasAcked = false;
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
                        else if (id.endsWith(".color")) {
                            val = colors_1.normalizeHexColor(val);
                            if (val != null) {
                                state.val = val;
                                operation = {
                                    color: val,
                                    transitionTime: yield getTransitionDuration(vGroup),
                                };
                            }
                        }
                        else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
                            operation = {
                                [id.substr(id.lastIndexOf(".") + 1)]: val,
                                transitionTime: yield getTransitionDuration(vGroup),
                            };
                        }
                        else if (id.endsWith(".transitionDuration")) {
                            // No operation here, since this is part of another one
                            wasAcked = true;
                        }
                        // update all lightbulbs in this group
                        if (operation != null) {
                            operations_1.operateVirtualGroup(vGroup, operation);
                            wasAcked = true;
                        }
                        // and ack the state change
                        if (wasAcked)
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
                                    val = colors_1.normalizeHexColor(val);
                                    if (val != null) {
                                        state.val = val;
                                        wasAcked = !(yield operations_1.operateLight(accessory, {
                                            color: val,
                                            transitionTime: yield getTransitionDuration(accessory),
                                        }));
                                    }
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
function connect(hostname, identity, code) {
    return __awaiter(this, void 0, void 0, function* () {
        // initialize CoAP client
        node_coap_client_1.CoapClient.reset();
        node_coap_client_1.CoapClient.setSecurityParams(hostname, {
            psk: { [identity]: code },
        });
        global_1.Global.log(`Connecting to gateway ${hostname}, identity = ${identity}, psk = ${code}`, "debug");
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
                return false;
            }
        }
        return true;
    });
}
function authenticate() {
    return __awaiter(this, void 0, void 0, function* () {
        // generate a new identity
        const identity = `tradfri_${Date.now()}`;
        global_1.Global.log(`authenticating with identity "${identity}"`, "debug");
        // request creation of new PSK
        let payload = JSON.stringify({ 9090: identity });
        payload = Buffer.from(payload);
        const response = yield node_coap_client_1.CoapClient.request(`${gateway_1.gateway.requestBase}${endpoints_1.endpoints.authentication}`, "post", payload);
        // check the response
        if (response.code.toString() !== "2.01") {
            global_1.Global.log(`unexpected response (${response.code.toString()}) to getPSK().`, "error");
            return null;
        }
        // the response is a buffer containing a JSON object as a string
        const pskResponse = JSON.parse(response.payload.toString("utf8"));
        const psk = pskResponse["9091"];
        // remember the identity/psk
        yield adapter.$setState("info.identity", identity, true);
        const identityObj = yield adapter.$getObject("info.identity");
        identityObj.native.psk = psk;
        yield adapter.$setObject("info.identity", identityObj);
        // and return it
        return { identity, psk };
    });
}
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
                const deviceName = iobroker_objects_1.calcObjName(gateway_1.gateway.devices[id]);
                yield adapter.$deleteDevice(deviceName);
                // remove device from dictionary
                delete gateway_1.gateway.devices[id];
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
    iobroker_objects_1.extendDevice(accessory);
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
                const groupName = iobroker_objects_1.calcGroupName(gateway_1.gateway.groups[id].group);
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
    return __awaiter(this, void 0, void 0, function* () {
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
        // read the transition duration, because the gateway won't report it
        group.transitionTime = yield getTransitionDuration(group);
        // and load scene information
        observeResource(`${endpoints_1.endpoints.scenes}/${instanceId}`, (resp) => coap_getAllScenes_cb(instanceId, resp));
    });
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
        iobroker_objects_1.updatePossibleScenes(groupInfo);
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
    iobroker_objects_1.updatePossibleScenes(gateway_1.gateway.groups[groupId]);
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
                    stateId = iobroker_objects_1.calcObjId(accessoryOrGroup) + ".lightbulb.transitionDuration";
            }
        }
        else if (accessoryOrGroup instanceof group_1.Group || accessoryOrGroup instanceof virtual_group_1.VirtualGroup) {
            stateId = iobroker_objects_1.calcGroupId(accessoryOrGroup) + ".transitionDuration";
        }
        const ret = yield adapter.$getState(stateId);
        if (ret != null)
            return ret.val;
        return 0.5; // default
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
            const id = iobroker_objects_1.calcGroupId(obj);
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
