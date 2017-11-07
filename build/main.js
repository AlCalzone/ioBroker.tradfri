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
// load tradfri data types
const node_tradfri_client_1 = require("node-tradfri-client");
// Eigene Module laden
const global_1 = require("./lib/global");
const object_polyfill_1 = require("./lib/object-polyfill");
// Datentypen laden
const virtual_group_1 = require("./lib/virtual-group");
// Adapter-Utils laden
const utils_1 = require("./lib/utils");
// Adapter-Module laden
const colors_1 = require("./lib/colors");
const fix_objects_1 = require("./lib/fix-objects");
const iobroker_objects_1 = require("./lib/iobroker-objects");
const custom_subscriptions_1 = require("./modules/custom-subscriptions");
const groups_1 = require("./modules/groups");
const message_1 = require("./modules/message");
const operations_1 = require("./modules/operations");
const session_1 = require("./modules/session");
// Adapter-Objekt erstellen
let adapter = utils_1.default.adapter({
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
        yield adapter.setState("info.connection", false, true);
        // Sicherstellen, dass die Optionen vollständig ausgefüllt sind.
        if (adapter.config
            && adapter.config.host != null && adapter.config.host !== ""
            && ((adapter.config.securityCode != null && adapter.config.securityCode !== "")
                || (adapter.config.identity != null && adapter.config.identity !== ""))) {
            // alles gut
        }
        else {
            adapter.log.error("Please set the connection params in the adapter options before starting the adapter!");
            return;
        }
        // redirect console output
        // console.log = (msg) => adapter.log.debug("STDOUT > " + msg);
        // console.error = (msg) => adapter.log.error("STDERR > " + msg);
        global_1.Global.log(`startfile = ${process.argv[1]}`);
        // watch own states
        adapter.subscribeStates(`${adapter.namespace}.*`);
        adapter.subscribeObjects(`${adapter.namespace}.*`);
        // add special watch for lightbulb states, so we can later sync the group states
        custom_subscriptions_1.subscribeStates(/L\-\d+\.lightbulb\./, groups_1.syncGroupsWithState);
        // Auth-Parameter laden
        const hostname = adapter.config.host.toLowerCase();
        const securityCode = adapter.config.securityCode;
        let identity = adapter.config.identity;
        let psk = adapter.config.psk;
        session_1.session.tradfri = new node_tradfri_client_1.TradfriClient(hostname, global_1.Global.log);
        if (securityCode != null && securityCode.length > 0) {
            // we temporarily stored the security code to replace it with identity/psk
            try {
                ({ identity, psk } = yield session_1.session.tradfri.authenticate(securityCode));
                // store it and restart the adapter
                global_1.Global.log(`The authentication was successful. The adapter should now restart. If not, please restart it manually.`, "info");
                yield updateConfig({
                    identity,
                    psk,
                    securityCode: "",
                });
            }
            catch (e) {
                if (e instanceof node_tradfri_client_1.TradfriError) {
                    switch (e.code) {
                        case node_tradfri_client_1.TradfriErrorCodes.ConnectionFailed: {
                            global_1.Global.log(`Could not connect to the gateway ${hostname}!`, "error");
                            global_1.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
                            return;
                        }
                        case node_tradfri_client_1.TradfriErrorCodes.AuthenticationFailed: {
                            global_1.Global.log(`The authentication failed. An update of the adapter might be necessary`, "error");
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
        else {
            // connect with previously negotiated identity and psk
            if (!(yield session_1.session.tradfri.connect(identity, psk))) {
                global_1.Global.log(`Could not connect to the gateway ${hostname}!`, "error");
                global_1.Global.log(`Please check your network and adapter settings and restart the adapter!`, "error");
                global_1.Global.log(`If the settings are correct, consider re-authentication in the adapter config.`, "error");
                return;
            }
        }
        yield adapter.$setState("info.connection", true, true);
        connectionAlive = true;
        pingTimer = setInterval(pingThread, 10000);
        loadVirtualGroups();
        // TODO: load known devices from ioBroker into <devices> & <objects>
        session_1.session.tradfri
            .on("device updated", tradfri_deviceUpdated)
            .on("device removed", tradfri_deviceRemoved)
            .on("group updated", tradfri_groupUpdated)
            .on("group removed", tradfri_groupRemoved)
            .on("scene updated", tradfri_sceneUpdated)
            .on("scene removed", tradfri_sceneRemoved);
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
                        const group = session_1.session.groups[rootObj.native.instanceId].group;
                        // if the change was acknowledged, update the state later
                        let wasAcked;
                        if (id.endsWith(".state")) {
                            wasAcked = !(yield group.toggle(val));
                        }
                        else if (id.endsWith(".brightness")) {
                            wasAcked = !(yield group.setBrightness(val, yield getTransitionDuration(group)));
                        }
                        else if (id.endsWith(".activeScene")) {
                            // turn on and activate a scene
                            wasAcked = !(yield group.activateScene(val));
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
                            const accessory = session_1.session.devices[rootObj.native.instanceId];
                            const light = accessory.lightList[0];
                            // if the change was acknowledged, update the state later
                            let wasAcked;
                            // operate the lights depending on the set state
                            // if no request was sent, we can ack the state immediately
                            if (id.endsWith(".state")) {
                                wasAcked = !(yield light.toggle(val));
                            }
                            else if (id.endsWith(".brightness")) {
                                wasAcked = !(yield light.setBrightness(val, yield getTransitionDuration(accessory)));
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
                            else if (/\.(colorTemperature|hue|saturation)$/.test(id)) {
                                // we're not using the simplified API here, since that means we have to repeat the if-clause 3 times.
                                wasAcked = !(yield session_1.session.tradfri.operateLight(accessory, {
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
            // close the gateway connection
            session_1.session.tradfri.destroy();
            adapter.setState("info.connection", false, true);
            callback();
        }
        catch (e) {
            callback();
        }
    },
});
function updateConfig(newConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create the config object
        let config = Object.assign({}, adapter.config);
        config = Object.assign(config, newConfig);
        // Update the adapter object
        const adapterObj = yield adapter.$getForeignObject(`system.adapter.${adapter.namespace}`);
        adapterObj.native = config;
        yield adapter.$setForeignObject(`system.adapter.${adapter.namespace}`, adapterObj);
    });
}
// ==================================
// manage devices
function observeAll() {
    return __awaiter(this, void 0, void 0, function* () {
        yield session_1.session.tradfri.observeDevices();
        yield session_1.session.tradfri.observeGroupsAndScenes();
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
            yield adapter.$deleteDevice(deviceName);
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
            yield adapter.$deleteChannel(groupName);
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
            }
        }
        else if (accessoryOrGroup instanceof node_tradfri_client_1.Group || accessoryOrGroup instanceof virtual_group_1.VirtualGroup) {
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
        Object.assign(session_1.session.virtualGroups, object_polyfill_1.composeObject(groupObjects.map(g => {
            const id = g.native.instanceId;
            const deviceIDs = g.native.deviceIDs.map(d => parseInt(d, 10));
            const ret = new virtual_group_1.VirtualGroup(id);
            ret.deviceIDs = deviceIDs;
            ret.name = g.common.name;
            return [`${id}`, ret];
        })));
        // remember the actual objects
        for (const obj of object_polyfill_1.values(session_1.session.virtualGroups)) {
            const id = iobroker_objects_1.calcGroupId(obj);
            session_1.session.objects[id] = iobObjects[id];
            // also remember all states
            const stateObjs = yield global_1.Global.$$(`${id}.*`, "state");
            for (const [sid, sobj] of object_polyfill_1.entries(stateObjs)) {
                session_1.session.objects[sid] = sobj;
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
        connectionAlive = yield session_1.session.tradfri.ping();
        global_1.Global.log(`ping ${connectionAlive ? "" : "un"}successful...`, "debug");
        yield adapter.$setStateChanged("info.connection", connectionAlive, true);
        // see if the connection state has changed
        if (connectionAlive) {
            pingFails = 0;
            if (!oldValue) {
                // connection is now alive again
                global_1.Global.log("Connection to gateway reestablished", "info");
                // restart observing if neccessary
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
                    session_1.session.tradfri.reset();
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
