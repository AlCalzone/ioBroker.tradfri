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
const helpers_1 = require("alcalzone-shared/helpers");
const objects_1 = require("alcalzone-shared/objects");
const node_tradfri_client_1 = require("node-tradfri-client");
const session_1 = require("../modules/session");
const global_1 = require("./global");
const math_1 = require("./math");
const object_polyfill_1 = require("./object-polyfill");
const strings_1 = require("./strings");
const virtual_group_1 = require("./virtual-group");
/**
 * Returns the common part of the ioBroker object representing the given accessory
 */
function accessoryToCommon(accessory) {
    const ret = {
        name: accessory.name || accessory.deviceInfo.modelNumber
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
        serialNumber: accessory.deviceInfo.serialNumber
    };
}
exports.accessoryToNative = accessoryToNative;
/**
 * Creates or edits an existing <device>-object for an accessory.
 * @param accessory The accessory to update
 */
function extendDevice(accessory) {
    return __awaiter(this, void 0, void 0, function* () {
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
                yield global_1.Global.adapter.extendObjectAsync(objId, devObj);
            // ====
            // from here we can update the states
            // filter out the ones belonging to this device with a property path
            const stateObjs = objects_1.filter(session_1.session.objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
            // for each property try to update the value
            for (const [id, obj] of objects_1.entries(stateObjs)) {
                if (global_1.Global.adapter.config.preserveTransitionTime &&
                    id.match(/\.transitionDuration$/g)) {
                    // don't override the transition time
                    continue;
                }
                try {
                    // Object could have a default value, find it
                    let newValue = object_polyfill_1.dig(accessory, obj.native.path);
                    const roundToDigits = global_1.Global.adapter.config.roundToDigits;
                    if (typeof roundToDigits === "number" &&
                        typeof newValue === "number") {
                        newValue = math_1.roundTo(newValue, roundToDigits);
                    }
                    if (obj.native.onlyChanges) {
                        yield global_1.Global.adapter.setStateChangedAsync(id, newValue, true);
                    }
                    else {
                        yield global_1.Global.adapter.setStateAsync(id, newValue, true);
                    }
                }
                catch (e) {
                    /* skip this value */
                }
            }
        }
        else {
            // create new object
            const devObj = {
                _id: objId,
                type: "device",
                common: accessoryToCommon(accessory),
                native: accessoryToNative(accessory)
            };
            yield global_1.Global.adapter.setObjectAsync(objId, devObj);
            // also create state objects, depending on the accessory type
            const stateObjs = {
                alive: {
                    // alive state
                    _id: `${objId}.alive`,
                    type: "state",
                    common: {
                        name: "device alive",
                        read: true,
                        write: false,
                        type: "boolean",
                        role: "indicator.alive",
                        desc: "indicates if the device is currently alive and connected to the gateway"
                    },
                    native: {
                        path: "alive"
                    }
                },
                lastSeen: {
                    // last seen state
                    _id: `${objId}.lastSeen`,
                    type: "state",
                    common: {
                        name: "last seen timestamp",
                        read: true,
                        write: false,
                        type: "number",
                        role: "indicator.lastSeen",
                        desc: "indicates when the device has last been seen by the gateway"
                    },
                    native: {
                        path: "lastSeen"
                    }
                }
            };
            if (accessory.type === node_tradfri_client_1.AccessoryTypes.lightbulb ||
                accessory.type === node_tradfri_client_1.AccessoryTypes.plug) {
                let channelName;
                let channelID;
                if (accessory.type === node_tradfri_client_1.AccessoryTypes.lightbulb) {
                    let spectrum = "none";
                    if (accessory.lightList != null &&
                        accessory.lightList.length > 0) {
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
                    channelID = "lightbulb";
                    stateObjs[channelID] = {
                        _id: `${objId}.${channelID}`,
                        type: "channel",
                        common: {
                            name: channelName,
                            role: "light"
                        },
                        native: {
                            spectrum: spectrum // remember the spectrum, so we can update different properties later
                        }
                    };
                    if (spectrum === "white") {
                        stateObjs[`${channelID}.colorTemperature`] = exports.objectDefinitions.colorTemperature(objId, "device");
                    }
                    else if (spectrum === "rgb") {
                        stateObjs[`${channelID}.color`] = exports.objectDefinitions.color(objId, "device");
                        stateObjs[`${channelID}.hue`] = exports.objectDefinitions.hue(objId, "device");
                        stateObjs[`${channelID}.saturation`] = exports.objectDefinitions.saturation(objId, "device");
                    }
                    stateObjs[`${channelID}.transitionDuration`] = exports.objectDefinitions.transitionDuration(objId, "device", accessory.type);
                } /* if (accessory.type === AccessoryTypes.plug) */
                else {
                    // obj.plug should be a channel
                    channelID = "plug";
                    stateObjs[channelID] = {
                        _id: `${objId}.${channelID}`,
                        type: "channel",
                        common: {
                            name: channelName,
                            role: "switch"
                        },
                        native: {}
                    };
                }
                // Common properties for both plugs and lights
                // We keep brightness for now, so groups of plugs and lights can use dimmer commands
                stateObjs[`${channelID}.brightness`] = exports.objectDefinitions.brightness(objId, "device", accessory.type);
                stateObjs[`${channelID}.state`] = exports.objectDefinitions.onOff(objId, "device", accessory.type);
            }
            if (accessory.deviceInfo.power === node_tradfri_client_1.PowerSources.Battery ||
                accessory.deviceInfo.power === node_tradfri_client_1.PowerSources.InternalBattery ||
                accessory.deviceInfo.power === node_tradfri_client_1.PowerSources.ExternalBattery) {
                if (accessory.deviceInfo.battery != undefined) {
                    // Some 3rd party devices send no battery info
                    stateObjs.battery = exports.objectDefinitions.batteryPercentage(objId, "device");
                }
            }
            if (accessory.type === node_tradfri_client_1.AccessoryTypes.blind) {
                stateObjs.position = exports.objectDefinitions.position(objId, "device", accessory.type);
                stateObjs.stopBlinds = exports.objectDefinitions.stopBlinds(objId, "device", accessory.type);
            }
            // Now create all objects
            for (const obj of objects_1.values(stateObjs)) {
                let initialValue = null;
                if (obj.native.path != null) {
                    // Object could have a default value, find it
                    initialValue = object_polyfill_1.dig(accessory, obj.native.path);
                }
                yield global_1.Global.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
            }
        }
    });
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
            // map scene ids and names to the dropdown
            const scenes = groupInfo.scenes;
            const newDropdownStates = objects_1.composeObject(Object.keys(scenes).map(id => [id, scenes[id].name]));
            // compare with the old dropdown states
            const obj = (yield global_1.Global.adapter.getObjectAsync(scenesId));
            const oldDropdownStates = obj.common.states;
            if (JSON.stringify(newDropdownStates) !==
                JSON.stringify(oldDropdownStates)) {
                // and only log and update if something changed
                global_1.Global.log(`updating possible scenes for group ${group.instanceId}: ${JSON.stringify(Object.keys(groupInfo.scenes))}`);
                obj.common.states = newDropdownStates;
                yield global_1.Global.adapter.setObjectAsync(scenesId, obj);
            }
        }
    });
}
exports.updatePossibleScenes = updatePossibleScenes;
function getAccessoryIcon(accessory) {
    if (accessory.type === node_tradfri_client_1.AccessoryTypes.blind) {
        return "blind.png";
    }
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
    if (model.indexOf(" control outlet ") > -1) {
        return "plug.png";
    }
    else if (model.toLowerCase().indexOf(" transformer ") > -1 ||
        model.toLowerCase().indexOf(" driver ") > -1) {
        return "transformer.png";
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
        case node_tradfri_client_1.AccessoryTypes.slaveRemote:
            prefix = "RC";
            break;
        case node_tradfri_client_1.AccessoryTypes.lightbulb:
            prefix = "L";
            break;
        case node_tradfri_client_1.AccessoryTypes.plug:
            prefix = "P";
            break;
        case node_tradfri_client_1.AccessoryTypes.blind:
            prefix = "B";
            break;
        case node_tradfri_client_1.AccessoryTypes.signalRepeater:
            prefix = "SR";
            break;
        case node_tradfri_client_1.AccessoryTypes.motionSensor:
            prefix = "MS";
            break;
        case node_tradfri_client_1.AccessoryTypes.soundRemote:
            prefix = "S";
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
    else if (group instanceof virtual_group_1.VirtualGroup) {
        if (typeof group.name === "string" && group.name.length > 0) {
            name = group.name;
        }
        else {
            name = `virtual group ${group.instanceId}`;
        }
    }
    else
        return helpers_1.assertNever(group);
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
        type: (group instanceof virtual_group_1.VirtualGroup ? "virtual " : "") + "group"
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
    else
        return helpers_1.assertNever(group);
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
/** Returns a string representation of a member of the `AccessoryTypes` enum */
function accessoryTypeToString(type) {
    return node_tradfri_client_1.AccessoryTypes[type];
}
function getCoapAccessoryPropertyPathPrefix(deviceType) {
    switch (deviceType) {
        case node_tradfri_client_1.AccessoryTypes.lightbulb:
            return "lightList.[0].";
        case node_tradfri_client_1.AccessoryTypes.plug:
            return "plugList.[0].";
        case node_tradfri_client_1.AccessoryTypes.blind:
            return "blindList.[0].";
        default:
            return "";
    }
}
/**
 * Contains definitions for all kinds of states we're going to create
 */
exports.objectDefinitions = {
    activeScene: (rootId, _rootType, _deviceType) => ({
        _id: `${rootId}.activeScene`,
        type: "state",
        common: {
            name: "active scene",
            read: true,
            write: true,
            type: "number",
            role: "value.id",
            desc: "the instance id of the currently active scene"
        },
        native: {
            path: "sceneId"
        }
    }),
    // Lights and plugs
    onOff: (rootId, rootType, deviceType) => ({
        _id: rootType === "device"
            ? `${rootId}.${accessoryTypeToString(deviceType)}.state`
            : `${rootId}.state`,
        type: "state",
        common: {
            name: "on/off",
            read: true,
            write: true,
            type: "boolean",
            role: "switch"
        },
        native: {
            path: getCoapAccessoryPropertyPathPrefix(deviceType) + "onOff"
        }
    }),
    // Lights and plugs for compatibility reasons
    // Anything > 0% should be "on"
    brightness: (rootId, rootType, deviceType) => {
        const deviceName = rootType === "device"
            ? accessoryTypeToString(deviceType)
            : undefined;
        return {
            _id: rootType === "device"
                ? `${rootId}.${deviceName}.brightness`
                : `${rootId}.brightness`,
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
                desc: rootType === "device"
                    ? `Brightness of the ${deviceName}`
                    : `Brightness of this group's ${deviceName}s`
            },
            native: {
                path: getCoapAccessoryPropertyPathPrefix(deviceType) + "dimmer"
            }
        };
    },
    // Lights only?
    transitionDuration: (rootId, rootType, deviceType) => ({
        _id: rootType === "device"
            ? `${rootId}.lightbulb.transitionDuration`
            : `${rootId}.transitionDuration`,
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
            desc: rootType === "device"
                ? "Duration of a state change"
                : `Duration for state changes of this group's lightbulbs`,
            unit: "s"
        },
        native: {
            path: getCoapAccessoryPropertyPathPrefix(deviceType) +
                "transitionTime"
        }
    }),
    // Lights only
    colorTemperature: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device"
                ? `${rootId}.lightbulb.colorTemperature`
                : `${rootId}.colorTemperature`,
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
                desc: rootType === "device"
                    ? "Range: 0% = cold, 100% = warm"
                    : "Color temperature of this group's white spectrum lightbulbs. Range: 0% = cold, 100% = warm"
            },
            native: {}
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
    // Lights only
    color: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device"
                ? `${rootId}.lightbulb.color`
                : `${rootId}.color`,
            type: "state",
            common: {
                name: "RGB color",
                read: true,
                write: true,
                type: "string",
                role: "level.color.rgb",
                desc: rootType === "device"
                    ? "6-digit RGB hex string"
                    : "Color of this group's RGB lightbulbs as a 6-digit hex string."
            },
            native: {}
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
    // Lights only
    hue: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device"
                ? `${rootId}.lightbulb.hue`
                : `${rootId}.hue`,
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
                desc: rootType === "device"
                    ? "Hue of this RGB lightbulb"
                    : "Hue of this group's RGB lightbulbs"
            },
            native: {}
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
    // Lights only
    saturation: (rootId, rootType) => {
        const ret = {
            _id: rootType === "device"
                ? `${rootId}.lightbulb.saturation`
                : `${rootId}.saturation`,
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
                desc: rootType === "device"
                    ? "Saturation of this RGB lightbulb"
                    : "Saturation of this group's RGB lightbulbs"
            },
            native: {}
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
    batteryPercentage: rootId => ({
        _id: `${rootId}.batteryPercentage`,
        type: "state",
        common: {
            name: "Battery percentage",
            read: true,
            write: false,
            type: "number",
            min: 0,
            max: 100,
            def: 100,
            role: "indicator.maintenance",
            unit: "%"
        },
        native: {
            path: "deviceInfo.battery",
            onlyChanges: true
        }
    }),
    // Blind position: 0% is open, 100% is closed
    position: (rootId, rootType, deviceType) => ({
        _id: rootType === "device"
            ? `${rootId}.${accessoryTypeToString(deviceType)}.position`
            : `${rootId}.position`,
        type: "state",
        common: {
            name: "Blind position",
            desc: (rootType === "device"
                ? "Position of the blind in percent."
                : "Position of this group's blinds in percent.") +
                " 0% is fully open, 100% is fully closed.",
            read: true,
            write: true,
            type: "number",
            min: 0,
            max: 100,
            role: "blind",
            unit: "%"
        },
        native: {
            path: getCoapAccessoryPropertyPathPrefix(deviceType) + "position"
        }
    }),
    // Blind position: 0% is open, 100% is closed
    stopBlinds: (rootId, rootType, deviceType) => {
        const isGroup = rootType !== "device";
        return {
            _id: isGroup
                ? `${rootId}.stopBlinds`
                : `${rootId}.${accessoryTypeToString(deviceType)}.stop`,
            type: "state",
            common: {
                name: isGroup ? "Stop blinds" : "Stop",
                desc: isGroup
                    ? "Stops all moving blinds in this group."
                    : "Stops the motion of this blind.",
                read: false,
                write: true,
                type: "boolean",
                role: "blind"
            },
            native: {
                // This is only a dummy path. The state changed handler in main.ts requires it to exist
                path: getCoapAccessoryPropertyPathPrefix(deviceType) + `stop${isGroup ? "Blinds" : ""}`
            }
        };
    }
};
