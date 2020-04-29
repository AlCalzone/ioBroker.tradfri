"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:object-literal-key-quotes
const path = require("path");
// actually load them now
const node_tradfri_client_1 = require("node-tradfri-client");
// Eigene Module laden
const objects_1 = require("alcalzone-shared/objects");
const global_1 = require("./lib/global");
// Datentypen laden
const virtual_group_1 = require("./lib/virtual-group");
// Adapter-Utils laden
const utils = require("@iobroker/adapter-core");
// Adapter-Module laden
const colors_1 = require("./lib/colors");
const fix_objects_1 = require("./lib/fix-objects");
const iobroker_objects_1 = require("./lib/iobroker-objects");
const custom_subscriptions_1 = require("./modules/custom-subscriptions");
const groups_1 = require("./modules/groups");
const message_1 = require("./modules/message");
const operations_1 = require("./modules/operations");
const helpers_1 = require("alcalzone-shared/helpers");
const math_1 = require("./lib/math");
const session_1 = require("./modules/session");
let connectionAlive;
let adapter;
function startAdapter(options = {}) {
    return adapter = utils.adapter(Object.assign(Object.assign({}, options), { 
        // custom options
        name: "tradfri", 
        // Wird aufgerufen, wenn Adapter initialisiert wird
        ready: () => __awaiter(this, void 0, void 0, function* () {
            // Adapter-Instanz global machen
            adapter = global_1.Global.extend(adapter);
            global_1.Global.adapter = adapter;
            // Fix our adapter objects to repair incompatibilities between versions
            yield fix_objects_1.ensureInstanceObjects();
            yield fix_objects_1.fixAdapterObjects();
            // we're not connected yet!
            yield adapter.setStateAsync("info.connection", false, true);
            // Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
            if (adapter.config
                && ((adapter.config.host != null && adapter.config.host !== "")
                    || adapter.config.discoverGateway) && ((adapter.config.securityCode != null && adapter.config.securityCode !== "")
                || (adapter.config.identity != null && adapter.config.identity !== ""))) {
                // alles gut
            }
            else {
                adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
                return;
            }
            // Auth-Parameter laden
            let hostname = adapter.config.host && adapter.config.host.toLowerCase();
            const useAutoDiscovery = adapter.config.discoverGateway;
            const securityCode = adapter.config.securityCode;
            let identity = adapter.config.identity;
            let psk = adapter.config.psk;
            if (useAutoDiscovery) {
                global_1.Global.log("Discovering the gateway automatically...");
                const discovered = yield node_tradfri_client_1.discoverGateway();
                if (discovered && discovered.addresses.length) {
                    global_1.Global.log(`Found gateway ${discovered.name || "with unknown name"} at ${discovered.addresses[0]}`);
                    hostname = discovered.addresses[0];
                }
                else {
                    global_1.Global.log("discovery failed!", "warn");
                    if (!hostname) {
                        adapter.log.error("In order to use this adapter without auto-discovery, please set a hostname!");
                        return;
                    }
                }
            }
            // Sicherstellen, dass die Anzahl der Nachkommastellen eine Zahl ist
            if (typeof adapter.config.roundToDigits === "string") {
                yield updateConfig({
                    roundToDigits: parseInt(adapter.config.roundToDigits, 10),
                });
            }
            // redirect console output
            // console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
            // console.error = (msg) => adapter.log.error("STDERR > " + msg);
            // watch own states
            adapter.subscribeStates(`${adapter.namespace}.*`);
            adapter.subscribeObjects(`${adapter.namespace}.*`);
            // add special watch for lightbulb and blind states, so we can later sync the group states
            custom_subscriptions_1.subscribeStates(/L\-\d+\.lightbulb\./, groups_1.syncGroupsWithState);
            custom_subscriptions_1.subscribeStates(/B\-\d+\.blind\./, groups_1.syncGroupsWithState);
            session_1.session.tradfri = new node_tradfri_client_1.TradfriClient(hostname, {
                customLogger: global_1.Global.log,
                watchConnection: true,
            });
            if (identity && identity.length > 0 && psk && psk.length > 0) {
                // connect with previously negotiated identity and psk
                session_1.session.tradfri.on("connection failed", (attempt, maxAttempts) => {
                    global_1.Global.log(`failed connection attempt ${attempt} of ${Number.isFinite(maxAttempts) ? maxAttempts : "∞"}`, "warn");
                });
                try {
                    yield session_1.session.tradfri.connect(identity, psk);
                }
                catch (e) {
                    if (e instanceof node_tradfri_client_1.TradfriError) {
                        switch (e.code) {
                            case node_tradfri_client_1.TradfriErrorCodes.ConnectionTimedOut: {
                                global_1.Global.log(`The gateway ${hostname} is unreachable or did not respond in time!`, "error");
                                global_1.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
                            }
                            case node_tradfri_client_1.TradfriErrorCodes.AuthenticationFailed: {
                                global_1.Global.log(`The stored credentials are no longer valid!`, "warn");
                                global_1.Global.log(`The adapter will now restart and re-authenticate! If not, please restart it manually.`, "warn");
                                yield updateConfig({
                                    identity: "",
                                    psk: "",
                                });
                                return;
                            }
                            case node_tradfri_client_1.TradfriErrorCodes.ConnectionFailed: {
                                global_1.Global.log(`Could not connect to the gateway ${hostname}!`, "error");
                                global_1.Global.log(e.message, "error");
                                return;
                            }
                        }
                    }
                    else {
                        global_1.Global.log(`Could not connect to the gateway ${hostname}!`, "error");
                        global_1.Global.log(e.message, "error");
                        return;
                    }
                }
            }
            else if (securityCode != null && securityCode.length > 0) {
                // use the security code to create an identity and psk
                try {
                    ({ identity, psk } = yield session_1.session.tradfri.authenticate(securityCode));
                    // store it and restart the adapter
                    global_1.Global.log(`The authentication was successful. The adapter should now restart. If not, please restart it manually.`, "info");
                    yield updateConfig({
                        identity,
                        psk,
                    });
                }
                catch (e) {
                    if (e instanceof node_tradfri_client_1.TradfriError) {
                        switch (e.code) {
                            case node_tradfri_client_1.TradfriErrorCodes.ConnectionTimedOut: {
                                global_1.Global.log(`The gateway ${hostname} is unreachable or did not respond in time!`, "error");
                                global_1.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
                            }
                            case node_tradfri_client_1.TradfriErrorCodes.AuthenticationFailed: {
                                global_1.Global.log(`The security code is incorrect or something else went wrong with the authentication.`, "error");
                                global_1.Global.log(`Please check your adapter settings and restart the adapter!`, "error");
                                return;
                            }
                            case node_tradfri_client_1.TradfriErrorCodes.ConnectionFailed: {
                                global_1.Global.log(`Could not authenticate with the gateway ${hostname}!`, "error");
                                global_1.Global.log(e.message, "error");
                                return;
                            }
                        }
                    }
                    else {
                        global_1.Global.log(`Could not authenticate with the gateway ${hostname}!`, "error");
                        global_1.Global.log(e.message, "error");
                        return;
                    }
                }
            }
            // watch the connection
            yield adapter.setStateAsync("info.connection", true, true);
            connectionAlive = true;
            session_1.session.tradfri
                .on("connection alive", () => {
                if (connectionAlive)
                    return;
                global_1.Global.log("Connection to gateway reestablished", "info");
                adapter.setState("info.connection", true, true);
                connectionAlive = true;
            })
                .on("connection lost", () => {
                if (!connectionAlive)
                    return;
                global_1.Global.log("Lost connection to gateway", "warn");
                adapter.setState("info.connection", false, true);
                connectionAlive = false;
            });
            yield loadDevices();
            yield loadGroups();
            yield loadVirtualGroups();
            session_1.session.tradfri
                .on("device updated", tradfri_deviceUpdated)
                .on("device removed", tradfri_deviceRemoved)
                .on("group updated", tradfri_groupUpdated)
                .on("group removed", tradfri_groupRemoved)
                .on("scene updated", tradfri_sceneUpdated)
                .on("scene removed", tradfri_sceneRemoved)
                .on("error", tradfri_error);
            observeAll();
        }), 
        // Handle sendTo-Messages
        message: message_1.onMessage, objectChange: (id, obj) => {
            global_1.Global.log(`{{blue}} object with id ${id} ${obj ? "updated" : "deleted"}`, "debug");
            if (id.startsWith(adapter.namespace)) {
                // this is our own object.
                if (obj) {
                    // first check if we have to modify a device/group/whatever
                    const instanceId = iobroker_objects_1.getInstanceId(id);
                    if (instanceId == undefined)
                        return;
                    if (obj.type === "device" && instanceId in session_1.session.devices && session_1.session.devices[instanceId] != null) {
                        // if this device is in the device list, check for changed properties
                        const acc = session_1.session.devices[instanceId];
                        if (obj.common && obj.common.name !== acc.name) {
                            // the name has changed, notify the gateway
                            global_1.Global.log(`the device ${id} was renamed to "${obj.common.name}"`);
                            operations_1.renameDevice(acc, obj.common.name);
                        }
                    }
                    else if (obj.type === "channel" && instanceId in session_1.session.groups && session_1.session.groups[instanceId] != null) {
                        // if this group is in the groups list, check for changed properties
                        const grp = session_1.session.groups[instanceId].group;
                        if (obj.common && obj.common.name !== grp.name) {
                            // the name has changed, notify the gateway
                            global_1.Global.log(`the group ${id} was renamed to "${obj.common.name}"`);
                            operations_1.renameGroup(grp, obj.common.name);
                        }
                    }
                    // remember the object
                    session_1.session.objects[id] = obj;
                }
                else {
                    // object deleted, forget it
                    if (id in session_1.session.objects)
                        delete session_1.session.objects[id];
                }
            }
            // apply additional subscriptions we've defined
            custom_subscriptions_1.applyCustomObjectSubscriptions(id, obj);
        }, stateChange: (id, state) => __awaiter(this, void 0, void 0, function* () {
            if (state) {
                global_1.Global.log(`{{blue}} state with id ${id} updated: ack=${state.ack}; val=${state.val}`, "debug");
            }
            else {
                global_1.Global.log(`{{blue}} state with id ${id} deleted`, "debug");
            }
            if (!connectionAlive && state && !state.ack && id.startsWith(adapter.namespace)) {
                global_1.Global.log("Not connected to the gateway. Cannot send changes!", "warn");
                return;
            }
            // apply additional subscriptions we've defined
            custom_subscriptions_1.applyCustomStateSubscriptions(id, state);
            // Eigene Handling-Logik zum Schluss, damit wir return benutzen können
            if (state && !state.ack && id.startsWith(adapter.namespace)) {
                // our own state was changed from within ioBroker, react to it
                const stateObj = session_1.session.objects[id];
                if (!(stateObj && stateObj.type === "state" && stateObj.native && stateObj.native.path))
                    return;
                // get "official" value for the parent object
                const rootId = iobroker_objects_1.getRootId(id);
                if (rootId) {
                    // get the ioBroker object
                    const rootObj = session_1.session.objects[rootId];
                    // for now: handle changes on a case by case basis
                    // everything else is too complicated for now
                    let val = state.val;
                    if (stateObj.common.type === "number") {
                        // node-tradfri-client handles floating point numbers,
                        // but we'll round to 2 digits for clarity (or the configured value)
                        let roundToDigits = adapter.config.roundToDigits || 2;
                        // don't round the transition duration!
                        if (id.endsWith("transitionDuration"))
                            roundToDigits = 2;
                        val = math_1.roundTo(val, roundToDigits);
                        if (stateObj.common.min != null)
                            val = Math.max(stateObj.common.min, val);
                        if (stateObj.common.max != null)
                            val = Math.min(stateObj.common.max, val);
                    }
                    switch (rootObj.native.type) {
                        case "group": {
                            // read the instanceId and get a reference value
                            if (!(rootObj.native.instanceId in session_1.session.groups)) {
                                global_1.Global.log(`The group with ID ${rootObj.native.instanceId} was not found!`, "warn");
                                return;
                            }
                            const group = session_1.session.groups[rootObj.native.instanceId].group;
                            // if the change was acknowledged, update the state later
                            let wasAcked = false;
                            if (id.endsWith(".state")) {
                                wasAcked = !(yield group.toggle(val));
                            }
                            else if (id.endsWith(".brightness")) {
                                wasAcked = !(yield group.setBrightness(val, yield getTransitionDuration(group)));
                            }
                            else if (id.endsWith(".position")) {
                                wasAcked = !(yield group.setPosition(val));
                            }
                            else if (id.endsWith(".activeScene")) {
                                // turn on and activate a scene
                                wasAcked = !(yield group.activateScene(val));
                            }
                            else if (id.endsWith(".color")) {
                                // color change is only supported manually, so we operate
                                // the virtual state of this group
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
                            else if (id.endsWith(".colorTemperature")) {
                                // color change is only supported manually, so we operate
                                // the virtual state of this group
                                yield operations_1.operateVirtualGroup(group, {
                                    colorTemperature: val,
                                    transitionTime: yield getTransitionDuration(group),
                                });
                                wasAcked = true;
                            }
                            else if (/\.(hue|saturation)$/.test(id)) {
                                // hue and saturation have to be set together
                                const prefix = id.substr(0, id.lastIndexOf(".") + 1);
                                // Try to read the hue and saturation states. If one of them doesn't exist,
                                // we cannot issue a command
                                const hueState = yield global_1.Global.adapter.getStateAsync(prefix + "hue");
                                if (hueState == undefined)
                                    return;
                                const saturationState = yield global_1.Global.adapter.getStateAsync(prefix + "saturation");
                                if (saturationState == undefined)
                                    return;
                                const hue = hueState.val;
                                const saturation = saturationState.val;
                                // color change is only supported manually, so we operate
                                // the virtual state of this group
                                yield operations_1.operateVirtualGroup(group, {
                                    hue,
                                    saturation,
                                    transitionTime: yield getTransitionDuration(group),
                                });
                                wasAcked = true;
                            }
                            else if (id.endsWith(".transitionDuration")) {
                                // this is part of another operation, just ack the state
                                wasAcked = true;
                            }
                            else if (id.endsWith(".stopBlinds")) {
                                // This is a button without feedback, so no need to setState afterwards
                                yield group.stopBlinds();
                            }
                            // ack the state if neccessary and return
                            if (wasAcked)
                                adapter.setStateAsync(id, state, true);
                            return;
                        }
                        case "virtual group": {
                            // find the virtual group instance
                            if (!(rootObj.native.instanceId in session_1.session.virtualGroups)) {
                                global_1.Global.log(`The virtual group with ID ${rootObj.native.instanceId} was not found!`, "warn");
                                return;
                            }
                            const vGroup = session_1.session.virtualGroups[rootObj.native.instanceId];
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
                            else if (id.endsWith(".position")) {
                                operation = {
                                    position: val,
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
                            else if (id.endsWith(".colorTemperature")) {
                                operation = {
                                    colorTemperature: val,
                                    transitionTime: yield getTransitionDuration(vGroup),
                                };
                            }
                            else if (/\.(hue|saturation)$/.test(id)) {
                                // hue and saturation have to be set together
                                const prefix = id.substr(0, id.lastIndexOf(".") + 1);
                                // Try to read the hue and saturation states. If one of them doesn't exist,
                                // we cannot issue a command
                                const hueState = yield global_1.Global.adapter.getStateAsync(prefix + "hue");
                                if (hueState == undefined)
                                    return;
                                const saturationState = yield global_1.Global.adapter.getStateAsync(prefix + "saturation");
                                if (saturationState == undefined)
                                    return;
                                const hue = hueState.val;
                                const saturation = saturationState.val;
                                operation = {
                                    hue,
                                    saturation,
                                    transitionTime: yield getTransitionDuration(vGroup),
                                };
                            }
                            else if (id.endsWith(".transitionDuration")) {
                                // No operation here, since this is part of another one
                                wasAcked = true;
                            }
                            else if (id.endsWith(".stopBlinds")) {
                                // This is a button without feedback, so no need to setState afterwards
                                yield operations_1.stopBlinds(vGroup);
                            }
                            // update all lightbulbs in this group
                            if (operation != null) {
                                operations_1.operateVirtualGroup(vGroup, operation);
                                wasAcked = true;
                            }
                            // and ack the state change
                            if (wasAcked)
                                adapter.setStateAsync(id, state, true);
                            return;
                        }
                        default: { // accessory
                            if (id.indexOf(".lightbulb.") > -1 || id.indexOf(".plug.") > -1 || id.indexOf(".blind.") > -1) {
                                // read the instanceId and get a reference value
                                if (!(rootObj.native.instanceId in session_1.session.devices)) {
                                    global_1.Global.log(`The device with ID ${rootObj.native.instanceId} was not found!`, "warn");
                                    return;
                                }
                                const accessory = session_1.session.devices[rootObj.native.instanceId];
                                const light = accessory.lightList && accessory.lightList[0];
                                const plug = accessory.plugList && accessory.plugList[0];
                                const blind = accessory.blindList && accessory.blindList[0];
                                const specificAccessory = light || plug || blind;
                                if (specificAccessory == undefined) {
                                    global_1.Global.log(`Cannot operate an accessory that is neither a lightbulb nor a plug nor a blind`, "warn");
                                    return;
                                }
                                // if the change was acknowledged, update the state later
                                let wasAcked = false;
                                // operate the lights depending on the set state
                                // if no request was sent, we can ack the state immediately
                                if (id.endsWith(".state")) {
                                    wasAcked = !(yield specificAccessory.toggle(val));
                                }
                                else if (id.endsWith(".brightness")) {
                                    if (light != undefined) {
                                        wasAcked = !(yield light.setBrightness(val, yield getTransitionDuration(accessory)));
                                    }
                                    else if (plug != undefined) {
                                        wasAcked = !(yield plug.setBrightness(val));
                                    }
                                }
                                else if (id.endsWith(".position")) {
                                    if (blind != undefined) {
                                        wasAcked = !(yield blind.setPosition(val));
                                    }
                                }
                                else if (id.endsWith(".color")) {
                                    // we need to differentiate here, because some ppl
                                    // might already have "color" states for white spectrum bulbs
                                    // in the future, we create different states for white and RGB bulbs
                                    if (light.spectrum === "rgb") {
                                        val = colors_1.normalizeHexColor(val);
                                        if (val != null) {
                                            state.val = val;
                                            wasAcked = !(yield light.setColor(val, yield getTransitionDuration(accessory)));
                                        }
                                    }
                                    else if (light.spectrum === "white") {
                                        wasAcked = !(yield light.setColorTemperature(val, yield getTransitionDuration(accessory)));
                                    }
                                }
                                else if (id.endsWith(".colorTemperature")) {
                                    wasAcked = !(yield light.setColorTemperature(val, yield getTransitionDuration(accessory)));
                                }
                                else if (/\.(hue|saturation)$/.test(id)) {
                                    // hue and saturation have to be set together
                                    const prefix = id.substr(0, id.lastIndexOf(".") + 1);
                                    // Try to read the hue and saturation states. If one of them doesn't exist,
                                    // we cannot issue a command
                                    const hueState = yield global_1.Global.adapter.getStateAsync(prefix + "hue");
                                    if (hueState == undefined)
                                        return;
                                    const saturationState = yield global_1.Global.adapter.getStateAsync(prefix + "saturation");
                                    if (saturationState == undefined)
                                        return;
                                    const hue = hueState.val;
                                    const saturation = saturationState.val;
                                    wasAcked = !(yield session_1.session.tradfri.operateLight(accessory, {
                                        hue,
                                        saturation,
                                        transitionTime: yield getTransitionDuration(accessory),
                                    }));
                                }
                                else if (id.endsWith(".transitionDuration")) {
                                    // this is part of another operation, just ack the state
                                    wasAcked = true;
                                }
                                else if (id.endsWith("blind.stop")) {
                                    // This is a button without feedback, so no need to setState afterwards
                                    yield blind.stop();
                                }
                                // ack the state if neccessary and return
                                if (wasAcked)
                                    adapter.setStateAsync(id, state, true);
                                return;
                            }
                        }
                    }
                }
            }
            else if (!state) {
                // TODO: find out what to do when states are deleted
            }
        }), unload: (callback) => {
            // is called when adapter shuts down - callback has to be called under any circumstances!
            try {
                // close the gateway connection
                session_1.session.tradfri.destroy();
                adapter.setState("info.connection", false, true);
                callback();
            }
            catch (e) {
                callback();
            }
        } }));
}
function updateConfig(newConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create the config object
        const config = Object.assign(Object.assign({}, adapter.config), newConfig);
        // Update the adapter object
        const adapterObj = (yield adapter.getForeignObjectAsync(`system.adapter.${adapter.namespace}`));
        adapterObj.native = config;
        yield adapter.setForeignObjectAsync(`system.adapter.${adapter.namespace}`, adapterObj);
    });
}
// ==================================
// manage devices
function observeAll() {
    return __awaiter(this, void 0, void 0, function* () {
        yield session_1.session.tradfri.observeDevices();
        global_1.Global.log("received all devices");
        yield session_1.session.tradfri.observeGroupsAndScenes();
        global_1.Global.log("received all groups and scenes");
    });
}
function tradfri_deviceUpdated(device) {
    // remember it
    session_1.session.devices[device.instanceId] = device;
    // create ioBroker device
    iobroker_objects_1.extendDevice(device);
}
function tradfri_deviceRemoved(instanceId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (instanceId in session_1.session.devices) {
            // delete ioBroker device
            const deviceName = iobroker_objects_1.calcObjName(session_1.session.devices[instanceId]);
            yield adapter.deleteDeviceAsync(deviceName);
            delete session_1.session.devices[instanceId];
        }
    });
}
function tradfri_groupUpdated(group) {
    return __awaiter(this, void 0, void 0, function* () {
        // remember the group
        if (!(group.instanceId in session_1.session.groups)) {
            // if there's none, create one
            session_1.session.groups[group.instanceId] = {
                group: null,
                scenes: {},
            };
        }
        session_1.session.groups[group.instanceId].group = group;
        // create ioBroker device
        groups_1.extendGroup(group);
        // clean up any states that might be incorrectly defined
        groups_1.updateGroupStates(group);
        // read the transition duration, because the gateway won't report it
        group.transitionTime = yield getTransitionDuration(group);
    });
}
function tradfri_groupRemoved(instanceId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (instanceId in session_1.session.groups) {
            // delete ioBroker group
            const groupName = iobroker_objects_1.calcGroupName(session_1.session.groups[instanceId].group);
            yield adapter.deleteChannelAsync(groupName);
            // remove group from dictionary
            delete session_1.session.groups[instanceId];
        }
    });
}
function tradfri_sceneUpdated(groupId, scene) {
    if (groupId in session_1.session.groups) {
        // remember the scene object, so we can later use it as a reference for updates
        session_1.session.groups[groupId].scenes[scene.instanceId] = scene;
        // Update the scene dropdown for the group
        iobroker_objects_1.updatePossibleScenes(session_1.session.groups[groupId]);
    }
}
function tradfri_sceneRemoved(groupId, instanceId) {
    if (groupId in session_1.session.groups) {
        const groupInfo = session_1.session.groups[groupId];
        // remove scene from dictionary
        if (instanceId in groupInfo.scenes)
            delete groupInfo.scenes[instanceId];
    }
}
function tradfri_error(error) {
    if (error instanceof node_tradfri_client_1.TradfriError) {
        if (error.code === node_tradfri_client_1.TradfriErrorCodes.NetworkReset ||
            error.code === node_tradfri_client_1.TradfriErrorCodes.ConnectionTimedOut) {
            return;
        } // it's okay, just swallow the error
    }
    global_1.Global.log(error.toString(), "error");
}
/**
 * Returns the configured transition duration for an accessory or a group
 */
function getTransitionDuration(accessoryOrGroup) {
    return __awaiter(this, void 0, void 0, function* () {
        let stateId;
        if (accessoryOrGroup instanceof node_tradfri_client_1.Accessory) {
            switch (accessoryOrGroup.type) {
                case node_tradfri_client_1.AccessoryTypes.lightbulb:
                    stateId = iobroker_objects_1.calcObjId(accessoryOrGroup) + ".lightbulb.transitionDuration";
                default:
                    return 0; // other accessories have no transition duration
            }
        }
        else if (accessoryOrGroup instanceof node_tradfri_client_1.Group || accessoryOrGroup instanceof virtual_group_1.VirtualGroup) {
            stateId = iobroker_objects_1.calcGroupId(accessoryOrGroup) + ".transitionDuration";
        }
        else
            return helpers_1.assertNever(accessoryOrGroup);
        const ret = yield adapter.getStateAsync(stateId);
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
        const groupObjects = objects_1.values(iobObjects).filter(g => {
            return g.native != null &&
                g.native.instanceId != null &&
                g.native.deviceIDs != null &&
                g.native.type === "virtual group";
        });
        // load them into the virtualGroups dict
        Object.assign(session_1.session.virtualGroups, objects_1.composeObject(groupObjects.map(g => {
            const id = g.native.instanceId;
            const deviceIDs = g.native.deviceIDs.map((d) => parseInt(d, 10));
            const ret = new virtual_group_1.VirtualGroup(id);
            ret.deviceIDs = deviceIDs;
            ret.name = g.common.name;
            return [`${id}`, ret];
        })));
        // remember the actual objects
        for (const obj of objects_1.values(session_1.session.virtualGroups)) {
            const id = iobroker_objects_1.calcGroupId(obj);
            session_1.session.objects[id] = iobObjects[id];
            // also remember all states
            const stateObjs = yield global_1.Global.$$(`${id}.*`, "state");
            for (const [sid, sobj] of objects_1.entries(stateObjs)) {
                session_1.session.objects[sid] = sobj;
            }
        }
    });
}
/**
 * Loads defined devices from the ioBroker objects DB
 */
function loadDevices() {
    return __awaiter(this, void 0, void 0, function* () {
        // find all defined devices
        const iobObjects = yield global_1.Global.$$(`${adapter.namespace}.*`, "device");
        const deviceObjects = objects_1.values(iobObjects).filter(d => {
            return d.native &&
                d.native.instanceId != null;
        });
        // remember the actual objects
        for (const obj of deviceObjects) {
            session_1.session.objects[obj._id] = obj;
            // also remember all states
            const stateObjs = yield global_1.Global.$$(`${obj._id}.*`, "state");
            for (const [sid, sobj] of objects_1.entries(stateObjs)) {
                session_1.session.objects[sid] = sobj;
            }
        }
    });
}
/**
 * Loads defined devices from the ioBroker objects DB
 */
function loadGroups() {
    return __awaiter(this, void 0, void 0, function* () {
        // find all defined groups
        const iobObjects = yield global_1.Global.$$(`${adapter.namespace}.G-*`, "channel");
        const groupObjects = objects_1.values(iobObjects).filter(g => {
            return g.native &&
                g.native.instanceId != null &&
                g.native.type === "group";
        });
        // remember the actual objects
        for (const obj of groupObjects) {
            session_1.session.objects[obj._id] = obj;
            // also remember all states
            const stateObjs = yield global_1.Global.$$(`${obj._id}.*`, "state");
            for (const [sid, sobj] of objects_1.entries(stateObjs)) {
                session_1.session.objects[sid] = sobj;
            }
        }
    });
}
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
function onUnhandledRejection(err) {
    let message = "unhandled promise rejection:" + getMessage(err);
    if (err instanceof Error && err.stack != null)
        message += "\n> stack: " + err.stack;
    (adapter && adapter.log || console).error(message);
    terminate(1, "unhandled promise rejection");
}
function onUnhandledError(err) {
    let message = "unhandled exception:" + getMessage(err);
    if (err.stack != null)
        message += "\n> stack: " + err.stack;
    (adapter && adapter.log || console).error(message);
    terminate(1, "unhandled exception");
}
function terminate(exitCode, reason) {
    if (adapter && typeof adapter.terminate === "function") {
        adapter.terminate(reason);
    }
    else {
        process.exit(exitCode);
    }
}
// Trace unhandled errors
process.on("unhandledRejection", onUnhandledRejection);
process.on("uncaughtException", onUnhandledError);
// try loading tradfri module to catch potential errors
let tradfriClientLibLoaded = false;
try {
    // tslint:disable-next-line:no-var-requires
    require("node-tradfri-client");
    tradfriClientLibLoaded = true;
}
catch (e) {
    console.error(`The module "node-aead-crypto" was not installed correctly!`);
    console.error(`To try reinstalling it, goto "${path.join(__dirname, "..")}" and run`);
    console.error(`npm install --production`);
    console.error(`If that fails due to missing access rights, run`);
    console.error(`${process.platform !== "win32" ? "sudo -H " : ""}npm install --production --unsafe-perm`);
    console.error(`instead. Afterwards, restart this adapter.`);
}
if (module.parent) {
    // Export startAdapter in compact mode
    if (tradfriClientLibLoaded) {
        module.exports = startAdapter;
    }
}
else {
    // Otherwise start the adapter immediately
    if (tradfriClientLibLoaded) {
        startAdapter();
    }
    else {
        terminate(11, "Required library missing"); // Do not restart!
    }
}
