"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_tradfri_client_1 = require("node-tradfri-client");
const session_1 = require("../modules/session");
const global_1 = require("./global");
const object_polyfill_1 = require("./object-polyfill");
const strings_1 = require("./strings");
const virtual_group_1 = require("./virtual-group");
/**
 * Returns the common part of the ioBroker object representing the given accessory
 */
function accessoryToCommon(accessory) {
    const ret = {
        name: accessory.name,
    };
    const icon = getAccessoryIcon(accessory);
    if (icon != null)
        ret.icon = "icons/" + icon;
    return ret;
}
exports.accessoryToCommon = accessoryToCommon;
/**
 * Returns the native part of the ioBroker object representing the given accessory
 */
function accessoryToNative(accessory) {
    return {
        instanceId: accessory.instanceId,
        manufacturer: accessory.deviceInfo.manufacturer,
        firmwareVersion: accessory.deviceInfo.firmwareVersion,
        modelNumber: accessory.deviceInfo.modelNumber,
        type: node_tradfri_client_1.AccessoryTypes[accessory.type],
        serialNumber: accessory.deviceInfo.serialNumber,
    };
}
exports.accessoryToNative = accessoryToNative;
/**
 * Creates or edits an existing <device>-object for an accessory.
 * @param accessory The accessory to update
 */
function extendDevice(accessory) {
    const objId = calcObjId(accessory);
    if (objId in session_1.session.objects) {
        // check if we need to edit the existing object
        const devObj = session_1.session.objects[objId];
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
            global_1.Global.adapter.extendObject(objId, devObj);
        // ====
        // from here we can update the states
        // filter out the ones belonging to this device with a property path
        const stateObjs = object_polyfill_1.filter(session_1.session.objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
        // for each property try to update the value
        for (const [id, obj] of object_polyfill_1.entries(stateObjs)) {
            if (global_1.Global.adapter.config.preserveTransitionTime && id.match(/\.transitionDuration$/g)) {
                // don't override the transition time
                continue;
            }
            try {
                // Object could have a default value, find it
                const newValue = object_polyfill_1.dig(accessory, obj.native.path);
                global_1.Global.adapter.setState(id, newValue, true);
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
        global_1.Global.adapter.setObject(objId, devObj);
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
        if (accessory.type === node_tradfri_client_1.AccessoryTypes.lightbulb) {
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
                stateObjs["lightbulb.colorTemperature"] = exports.objectDefinitions.colorTemperature(objId, "device");
            }
            else if (spectrum === "rgb") {
                stateObjs["lightbulb.color"] = exports.objectDefinitions.color(objId, "device");
                stateObjs["lightbulb.hue"] = exports.objectDefinitions.hue(objId, "device");
                stateObjs["lightbulb.saturation"] = exports.objectDefinitions.saturation(objId, "device");
            }
            stateObjs["lightbulb.brightness"] = exports.objectDefinitions.brightness(objId, "device");
            stateObjs["lightbulb.state"] = exports.objectDefinitions.onOff(objId, "device");
            stateObjs["lightbulb.transitionDuration"] = exports.objectDefinitions.transitionDuration(objId, "device");
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
            return global_1.Global.adapter.$createOwnStateEx(obj._id, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
exports.extendDevice = extendDevice;
/**
 * Updates the possible scenes for a group
 * @param groupInfo The group to update
 */
function updatePossibleScenes(groupInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const group = groupInfo.group;
        // if this group is not in the dictionary, don't do anything
        if (!(group.instanceId in session_1.session.groups))
            return;
        // find out which is the root object id
        const objId = calcGroupId(group);
        // scenes are stored under <objId>.activeScene
        const scenesId = `${objId}.activeScene`;
        // only extend that object if it exists already
        if (scenesId in session_1.session.objects) {
            global_1.Global.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);
            const scenes = groupInfo.scenes;
            // map scene ids and names to the dropdown
            const states = object_polyfill_1.composeObject(Object.keys(scenes).map(id => [id, scenes[id].name]));
            const obj = yield global_1.Global.adapter.$getObject(scenesId);
            obj.common.states = states;
            yield global_1.Global.adapter.$setObject(scenesId, obj);
        }
    });
}
exports.updatePossibleScenes = updatePossibleScenes;
function getAccessoryIcon(accessory) {
    const model = accessory.deviceInfo.modelNumber;
    switch (model) {
        case "TRADFRI remote control":
            return "remote.png";
        case "TRADFRI motion sensor":
            return "motion_sensor.png";
        case "TRADFRI wireless dimmer":
            return "remote_dimmer.png";
        case "TRADFRI plug":
            return "plug.png";
    }
    if (accessory.type === node_tradfri_client_1.AccessoryTypes.lightbulb) {
        let prefix;
        if (model.indexOf(" panel ") > -1) {
            prefix = "panel";
        }
        else if (model.indexOf(" door ") > -1) {
            prefix = "door";
        }
        else if (model.indexOf(" GU10 ") > -1) {
            prefix = "gu10";
        }
        else {
            prefix = "bulb";
        }
        let suffix = "";
        const spectrum = accessory.lightList[0].spectrum;
        if (spectrum === "white") {
            suffix = "_ws";
        }
        else if (spectrum === "rgb") {
            suffix = "_rgb";
        }
        return prefix + suffix + ".png";
    }
}
exports.getAccessoryIcon = getAccessoryIcon;
/**
 * Returns the ioBroker id of the root object for the given state
 */
function getRootId(stateId) {
    const match = /^tradfri\.\d+\.\w+\-\d+/.exec(stateId);
    if (match)
        return match[0];
}
exports.getRootId = getRootId;
/**
 * Extracts the instance id from a given state or object id
 * @param id State or object id whose instance id should be extracted
 */
function getInstanceId(id) {
    const match = /^tradfri\.\d+\.\w+\-(\d+)/.exec(id);
    if (match)
        return +match[1];
}
exports.getInstanceId = getInstanceId;
/**
 * Determines the object ID under which the given accessory should be stored
 */
function calcObjId(accessory) {
    return `${global_1.Global.adapter.namespace}.${calcObjName(accessory)}`;
}
exports.calcObjId = calcObjId;
/**
 * Determines the object name under which the given group accessory be stored,
 * excluding the adapter namespace
 */
function calcObjName(accessory) {
    let prefix;
    switch (accessory.type) {
        case node_tradfri_client_1.AccessoryTypes.remote:
            prefix = "RC";
            break;
        case node_tradfri_client_1.AccessoryTypes.lightbulb:
            prefix = "L";
            break;
        default:
            global_1.Global.log(`Unknown accessory type ${accessory.type}. Please send this info to the developer with a short description of the device!`, "warn");
            prefix = "XYZ";
            break;
    }
    return `${prefix}-${accessory.instanceId}`;
}
exports.calcObjName = calcObjName;
/**
 * Returns the common part of the ioBroker object representing the given group
 */
function groupToCommon(group) {
    let name;
    if (group instanceof node_tradfri_client_1.Group) {
        name = group.name;
    }
    else {
        if (typeof group.name === "string" && group.name.length > 0) {
            name = group.name;
        }
        else {
            name = `virtual group ${group.instanceId}`;
        }
    }
    return { name };
}
exports.groupToCommon = groupToCommon;
/**
 * Returns the native part of the ioBroker object representing the given group
 */
function groupToNative(group) {
    return {
        instanceId: group.instanceId,
        deviceIDs: group.deviceIDs,
        type: (group instanceof virtual_group_1.VirtualGroup ? "virtual " : "") + "group",
    };
}
exports.groupToNative = groupToNative;
/**
 * Determines the object ID under which the given group should be stored
 */
function calcGroupId(group) {
    return `${global_1.Global.adapter.namespace}.${calcGroupName(group)}`;
}
exports.calcGroupId = calcGroupId;
/**
 * Determines the object name under which the given group should be stored,
 * excluding the adapter namespace
 */
function calcGroupName(group) {
    let prefix;
    if (group instanceof node_tradfri_client_1.Group) {
        prefix = "G";
    }
    else if (group instanceof virtual_group_1.VirtualGroup) {
        prefix = "VG";
    }
    const postfix = group.instanceId.toString();
    return `${prefix}-${strings_1.padStart(postfix, 5, "0")}`;
}
exports.calcGroupName = calcGroupName;
/**
 * Determines the object ID under which the given scene should be stored
 */
function calcSceneId(scene) {
    return `${global_1.Global.adapter.namespace}.${calcSceneName(scene)}`;
}
exports.calcSceneId = calcSceneId;
/**
 * Determines the object name under which the given scene should be stored,
 * excluding the adapter namespace
 */
function calcSceneName(scene) {
    return `S-${scene.instanceId}`;
}
exports.calcSceneName = calcSceneName;
/**
 * Contains definitions for all kinds of states we're going to create
 */
exports.objectDefinitions = {
    activeScene: (rootId, rootType) => ({
        _id: `${rootId}.activeScene`,
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
    }),
    onOff: (rootId, rootType) => ({
        _id: rootType === "device" ? `${rootId}.lightbulb.state` : `${rootId}.state`,
        type: "state",
        common: {
            name: "on/off",
            read: true,
            write: true,
            type: "boolean",
            role: "switch",
        },
        native: {
            path: rootType === "device" ? "lightList.[0].onOff" : "onOff",
        },
    }),
    brightness: (rootId, rootType) => ({
        _id: rootType === "device" ? `${rootId}.lightbulb.brightness` : `${rootId}.brightness`,
        type: "state",
        common: {
            name: "Brightness",
            read: true,
            write: true,
            min: 0,
            max: 100,
            unit: "%",
            type: "number",
            role: "level.dimmer",
            desc: rootType === "device" ?
                "Brightness of the lightbulb" :
                "Brightness of this group's lightbulbs",
        },
        native: {
            path: rootType === "device" ? "lightList.[0].dimmer" : "dimmer",
        },
    }),
    transitionDuration: (rootId, rootType) => ({
        _id: rootType === "device" ? `${rootId}.lightbulb.transitionDuration` : `${rootId}.transitionDuration`,
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
            desc: rootType === "device" ?
                "Duration of a state change" :
                "Duration for state changes of this group's lightbulbs",
            unit: "s",
        },
        native: {
            path: rootType === "device" ? "lightList.[0].transitionTime" : "transitionTime",
        },
    }),
    colorTemperature: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device" ? `${rootId}.lightbulb.colorTemperature` : `${rootId}.colorTemperature`,
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
                desc: rootType === "device" ?
                    "Range: 0% = cold, 100% = warm" :
                    "Color temperature of this group's white spectrum lightbulbs. Range: 0% = cold, 100% = warm",
            },
            native: {},
        };
        if (rootType === "device") {
            ret.native.path = "lightList.[0].colorTemperature";
        }
        else if (rootType === "group") {
            // virtual state, so no real path to an object exists
            // we still have to give path a value, because other functions check for its existence
            ret.native.path = "__virtual__";
        }
        else if (rootType === "virtual group") {
            ret.native.path = "colorTemperature";
        }
        return ret;
    },
    color: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device" ? `${rootId}.lightbulb.color` : `${rootId}.color`,
            type: "state",
            common: {
                name: "RGB color",
                read: true,
                write: true,
                type: "string",
                role: "level.color",
                desc: rootType === "device" ?
                    "6-digit RGB hex string" :
                    "Color of this group's RGB lightbulbs as a 6-digit hex string.",
            },
            native: {},
        };
        if (rootType === "device") {
            ret.native.path = "lightList.[0].color";
        }
        else if (rootType === "group") {
            // virtual state, so no real path to an object exists
            // we still have to give path a value, because other functions check for its existence
            ret.native.path = "__virtual__";
        }
        else if (rootType === "virtual group") {
            ret.native.path = "color";
        }
        return ret;
    },
    hue: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device" ? `${rootId}.lightbulb.hue` : `${rootId}.hue`,
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
                desc: rootType === "device" ?
                    "Hue of this RGB lightbulb" :
                    "Hue of this group's RGB lightbulbs",
            },
            native: {},
        };
        if (rootType === "device") {
            ret.native.path = "lightList.[0].hue";
        }
        else if (rootType === "group") {
            // virtual state, so no real path to an object exists
            // we still have to give path a value, because other functions check for its existence
            ret.native.path = "__virtual__";
        }
        else if (rootType === "virtual group") {
            ret.native.path = "hue";
        }
        return ret;
    },
    saturation: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device" ? `${rootId}.lightbulb.saturation` : `${rootId}.saturation`,
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
                desc: rootType === "device" ?
                    "Saturation of this RGB lightbulb" :
                    "Saturation of this group's RGB lightbulbs",
            },
            native: {},
        };
        if (rootType === "device") {
            ret.native.path = "lightList.[0].saturation";
        }
        else if (rootType === "group") {
            // virtual state, so no real path to an object exists
            // we still have to give path a value, because other functions check for its existence
            ret.native.path = "__virtual__";
        }
        else if (rootType === "virtual group") {
            ret.native.path = "saturation";
        }
        return ret;
    },
};
