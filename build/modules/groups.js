"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const group_1 = require("../ipso/group");
const global_1 = require("../lib/global");
const object_polyfill_1 = require("../lib/object-polyfill");
const strings_1 = require("../lib/strings");
const virtual_group_1 = require("../lib/virtual-group");
const gateway_1 = require("./gateway");
/**
 * Returns the common part of the ioBroker object representing the given group
 */
function groupToCommon(group) {
    let name;
    if (group instanceof group_1.Group) {
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
    if (group instanceof group_1.Group) {
        prefix = "G";
    }
    else if (group instanceof virtual_group_1.VirtualGroup) {
        prefix = "VG";
    }
    const postfix = group.instanceId.toString();
    return `${prefix}-${strings_1.padStart(postfix, 5, "0")}`;
}
exports.calcGroupName = calcGroupName;
/* creates or edits an existing <group>-object for a virtual group */
function extendVirtualGroup(group) {
    const objId = calcGroupId(group);
    if (objId in gateway_1.gateway.objects) {
        // check if we need to edit the existing object
        const grpObj = gateway_1.gateway.objects[objId];
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
            global_1.Global.adapter.extendObject(objId, grpObj);
        // TODO: Update group states where applicable. See extendGroup for the code
    }
    else {
        // create new object
        const devObj = {
            _id: objId,
            type: "channel",
            common: groupToCommon(group),
            native: groupToNative(group),
        };
        global_1.Global.adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        const stateObjs = {
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
                    read: true,
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
            colorTemperature: {
                _id: `${objId}.colorTemperature`,
                type: "state",
                common: {
                    name: "White spectrum color temperature",
                    read: true,
                    write: true,
                    min: 0,
                    max: 100,
                    unit: "%",
                    type: "number",
                    role: "level.color.temperature",
                    desc: "Color temperature of this group's white spectrum lightbulbs. Range: 0% = cold, 100% = warm",
                },
                native: {
                    path: "colorTemperature",
                },
            },
            color: {
                _id: `${objId}.color`,
                type: "state",
                common: {
                    name: "RGB color",
                    read: true,
                    write: true,
                    type: "string",
                    role: "level.color",
                    desc: "Color of this group's RGB lightbulbs as a 6-digit hex string.",
                },
                native: {
                    path: "color",
                },
            },
            hue: {
                _id: `${objId}.hue`,
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
                    desc: "Hue of this group's RGB lightbulbs.",
                },
                native: {
                    path: "hue",
                },
            },
            saturation: {
                _id: `${objId}.saturation`,
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
                    desc: "Saturation of this group's RGB lightbulbs.",
                },
                native: {
                    path: "saturation",
                },
            },
        };
        const createObjects = Object.keys(stateObjs)
            .map((key) => {
            const obj = stateObjs[key];
            let initialValue = null;
            if (obj.native.path != null) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(group, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return global_1.Global.adapter.$createOwnStateEx(obj._id, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
exports.extendVirtualGroup = extendVirtualGroup;
/* creates or edits an existing <group>-object for a group */
function extendGroup(group) {
    const objId = calcGroupId(group);
    if (objId in gateway_1.gateway.objects) {
        // check if we need to edit the existing object
        const grpObj = gateway_1.gateway.objects[objId];
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
            global_1.Global.adapter.extendObject(objId, grpObj);
        // ====
        // from here we can update the states
        // filter out the ones belonging to this device with a property path
        const stateObjs = object_polyfill_1.filter(gateway_1.gateway.objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
        // for each property try to update the value
        for (const [id, obj] of object_polyfill_1.entries(stateObjs)) {
            try {
                // Object could have a default value, find it
                const newValue = object_polyfill_1.dig(group, obj.native.path);
                global_1.Global.adapter.setState(id, newValue, true);
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
        global_1.Global.adapter.setObject(objId, devObj);
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
            colorTemperature: {
                _id: `${objId}.colorTemperature`,
                type: "state",
                common: {
                    name: "White spectrum color temperature",
                    read: true,
                    write: true,
                    min: 0,
                    max: 100,
                    unit: "%",
                    type: "number",
                    role: "level.color.temperature",
                    desc: "Color temperature of this group's white spectrum lightbulbs. Range: 0% = cold, 100% = warm",
                },
                native: {
                    // virtual state, so no real path to an object exists
                    // we still have to give path a value, because other functions check for its existence
                    path: "__virtual__",
                },
            },
            color: {
                _id: `${objId}.color`,
                type: "state",
                common: {
                    name: "RGB color",
                    read: true,
                    write: true,
                    type: "string",
                    role: "level.color",
                    desc: "Color of this group's RGB lightbulbs as a 6-digit hex string.",
                },
                native: {
                    // virtual state, so no real path to an object exists
                    // we still have to give path a value, because other functions check for its existence
                    path: "__virtual__",
                },
            },
            hue: {
                _id: `${objId}.hue`,
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
                    desc: "Hue of this group's RGB lightbulbs.",
                },
                native: {
                    // virtual state, so no real path to an object exists
                    // we still have to give path a value, because other functions check for its existence
                    path: "__virtual__",
                },
            },
            saturation: {
                _id: `${objId}.saturation`,
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
                    desc: "Saturation of this group's RGB lightbulbs.",
                },
                native: {
                    // virtual state, so no real path to an object exists
                    // we still have to give path a value, because other functions check for its existence
                    path: "__virtual__",
                },
            },
        };
        const createObjects = Object.keys(stateObjs)
            .map((key) => {
            const obj = stateObjs[key];
            let initialValue = null;
            if (obj.native.path != null) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(group, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return global_1.Global.adapter.$createOwnStateEx(obj._id, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
exports.extendGroup = extendGroup;
