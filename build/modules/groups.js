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
const objects_1 = require("alcalzone-shared/objects");
const node_tradfri_client_1 = require("node-tradfri-client");
const global_1 = require("../lib/global");
const iobroker_objects_1 = require("../lib/iobroker-objects");
const math_1 = require("../lib/math");
const object_polyfill_1 = require("../lib/object-polyfill");
const session_1 = require("./session");
/* creates or edits an existing <group>-object for a virtual group */
function extendVirtualGroup(group) {
    const objId = iobroker_objects_1.calcGroupId(group);
    if (objId in session_1.session.objects) {
        // check if we need to edit the existing object
        const grpObj = session_1.session.objects[objId];
        let changed = false;
        // update common part if neccessary
        const newCommon = iobroker_objects_1.groupToCommon(group);
        if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
            // merge the common objects
            Object.assign(grpObj.common, newCommon);
            changed = true;
        }
        const newNative = iobroker_objects_1.groupToNative(group);
        // update native part if neccessary
        if (JSON.stringify(grpObj.native) !== JSON.stringify(newNative)) {
            // merge the native objects
            Object.assign(grpObj.native, newNative);
            changed = true;
        }
        if (changed)
            global_1.Global.adapter.setObject(objId, grpObj);
        // TODO: Update group states where applicable. See extendGroup for the code
    }
    else {
        // create new object
        const devObj = {
            _id: objId,
            type: "channel",
            common: iobroker_objects_1.groupToCommon(group),
            native: iobroker_objects_1.groupToNative(group)
        };
        global_1.Global.adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        // prettier-ignore
        const stateObjs = {
            state: iobroker_objects_1.objectDefinitions.onOff(objId, "virtual group"),
            transitionDuration: iobroker_objects_1.objectDefinitions.transitionDuration(objId, "virtual group"),
            brightness: iobroker_objects_1.objectDefinitions.brightness(objId, "virtual group"),
            colorTemperature: iobroker_objects_1.objectDefinitions.colorTemperature(objId, "virtual group"),
            color: iobroker_objects_1.objectDefinitions.color(objId, "virtual group"),
            hue: iobroker_objects_1.objectDefinitions.hue(objId, "virtual group"),
            saturation: iobroker_objects_1.objectDefinitions.saturation(objId, "virtual group"),
            position: iobroker_objects_1.objectDefinitions.position(objId, "virtual group"),
            stopBlinds: iobroker_objects_1.objectDefinitions.stopBlinds(objId, "virtual group"),
        };
        const createObjects = Object.keys(stateObjs).map(key => {
            const obj = stateObjs[key];
            let initialValue = null;
            if (obj.native.path != null) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(group, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return global_1.Global.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
exports.extendVirtualGroup = extendVirtualGroup;
/* creates or edits an existing <group>-object for a group */
function extendGroup(group) {
    const objId = iobroker_objects_1.calcGroupId(group);
    if (objId in session_1.session.objects) {
        // check if we need to edit the existing object
        const grpObj = session_1.session.objects[objId];
        let changed = false;
        // update common part if neccessary
        const newCommon = iobroker_objects_1.groupToCommon(group);
        if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
            // merge the common objects
            Object.assign(grpObj.common, newCommon);
            changed = true;
        }
        const newNative = iobroker_objects_1.groupToNative(group);
        // update native part if neccessary
        if (JSON.stringify(grpObj.native) !== JSON.stringify(newNative)) {
            // merge the native objects
            Object.assign(grpObj.native, newNative);
            changed = true;
        }
        if (changed)
            global_1.Global.adapter.setObject(objId, grpObj);
        // ====
        // from here we can update the states
        // filter out the ones belonging to this device with a property path
        const stateObjs = objects_1.filter(session_1.session.objects, obj => obj._id.startsWith(objId) && obj.native && obj.native.path);
        // for each property try to update the value
        for (const [id, obj] of objects_1.entries(stateObjs)) {
            try {
                // Object could have a default value, find it
                let newValue = object_polyfill_1.dig(group, obj.native.path);
                const roundToDigits = global_1.Global.adapter.config.roundToDigits;
                if (typeof roundToDigits === "number" &&
                    typeof newValue === "number") {
                    newValue = math_1.roundTo(newValue, roundToDigits);
                }
                global_1.Global.adapter.setState(id, newValue, true);
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
            type: "channel",
            common: iobroker_objects_1.groupToCommon(group),
            native: iobroker_objects_1.groupToNative(group)
        };
        global_1.Global.adapter.setObject(objId, devObj);
        // also create state objects, depending on the accessory type
        // prettier-ignore
        const stateObjs = {
            activeScene: iobroker_objects_1.objectDefinitions.activeScene(objId, "group"),
            state: iobroker_objects_1.objectDefinitions.onOff(objId, "group"),
            transitionDuration: iobroker_objects_1.objectDefinitions.transitionDuration(objId, "group"),
            brightness: iobroker_objects_1.objectDefinitions.brightness(objId, "group"),
            colorTemperature: iobroker_objects_1.objectDefinitions.colorTemperature(objId, "group"),
            color: iobroker_objects_1.objectDefinitions.color(objId, "group"),
            hue: iobroker_objects_1.objectDefinitions.hue(objId, "group"),
            saturation: iobroker_objects_1.objectDefinitions.saturation(objId, "group"),
            position: iobroker_objects_1.objectDefinitions.position(objId, "group"),
            stopBlinds: iobroker_objects_1.objectDefinitions.stopBlinds(objId, "group"),
        };
        const createObjects = Object.keys(stateObjs).map(key => {
            const obj = stateObjs[key];
            let initialValue = null;
            if (obj.native.path != null) {
                // Object could have a default value, find it
                initialValue = object_polyfill_1.dig(group, obj.native.path);
            }
            // create object and return the promise, so we can wait
            return global_1.Global.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
        });
        Promise.all(createObjects);
    }
}
exports.extendGroup = extendGroup;
/** Returns the only value in the given array if they are all the same, otherwise null */
function getCommonValue(arr) {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] !== arr[i - 1])
            return null;
    }
    return arr[0];
}
const updateTimers = {};
function debounce(id, action, timeout) {
    // clear existing timeouts
    if (id in updateTimers)
        clearTimeout(updateTimers[id]);
    // set a new debounce timer
    updateTimers[id] = setTimeout(() => {
        delete updateTimers[id];
        action();
    }, timeout);
}
function updateGroupState(id, value) {
    return __awaiter(this, void 0, void 0, function* () {
        const curState = yield global_1.Global.adapter.getStateAsync(id);
        if (curState != null && value == null) {
            yield global_1.Global.adapter.delStateAsync(id);
        }
        else if (curState !== value) {
            const roundToDigits = global_1.Global.adapter.config.roundToDigits;
            if (typeof roundToDigits === "number" && typeof value === "number") {
                value = math_1.roundTo(value, roundToDigits);
            }
            yield global_1.Global.adapter.setStateAsync(id, value, true);
        }
    });
}
/**
 * Updates all group states that are equal for all its devices
 * @param changedAccessory If defined, only update the groups this is a part of.
 * @param changedStateId If defined, only update the corresponding states in the group.
 */
function updateMultipleGroupStates(changedAccessory, changedStateId) {
    const groupsToUpdate = objects_1.values(session_1.session.groups)
        .map(g => g.group)
        .concat(objects_1.values(session_1.session.virtualGroups))
        .filter(g => changedAccessory == null ||
        (g.deviceIDs != undefined &&
            g.deviceIDs.indexOf(changedAccessory.instanceId) > -1));
    for (const group of groupsToUpdate) {
        updateGroupStates(group, changedStateId);
    }
}
exports.updateMultipleGroupStates = updateMultipleGroupStates;
function updateGroupStates(group, changedStateId) {
    if (group.deviceIDs == null)
        return;
    const objId = iobroker_objects_1.calcGroupId(group);
    const groupBulbs = group.deviceIDs
        .map(id => session_1.session.devices[id])
        .filter(a => a != null && a.type === node_tradfri_client_1.AccessoryTypes.lightbulb)
        .map(a => a.lightList[0]);
    const groupBlinds = group.deviceIDs
        .map(id => session_1.session.devices[id])
        .filter(a => a != null && a.type === node_tradfri_client_1.AccessoryTypes.blind)
        .map(a => a.blindList[0]);
    const groupPlugs = group.deviceIDs
        .map(id => session_1.session.devices[id])
        .filter(a => a != null && a.type === node_tradfri_client_1.AccessoryTypes.plug)
        .map(a => a.plugList[0]);
    // Seperate the bulbs into no spectrum/white spectrum/rgb bulbs
    const whiteSpectrumBulbs = groupBulbs.filter(b => b.spectrum === "white");
    const rgbBulbs = groupBulbs.filter(b => b.spectrum === "rgb");
    // we're debouncing the state changes, so group or scene updates don't result in
    // deleting and recreating states
    const debounceTimeout = 250;
    // Try to update the on/off state
    if (groupBulbs.length > 0 &&
        (changedStateId == null || changedStateId.endsWith("lightbulb.state"))) {
        const commonState = getCommonValue(groupBulbs.map(b => b.onOff));
        // TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
        group.onOff = commonState;
        const stateId = `${objId}.state`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the brightness state
    if (groupBulbs.length > 0 &&
        (changedStateId == null ||
            changedStateId.endsWith("lightbulb.brightness"))) {
        const commonState = getCommonValue(groupBulbs.map(b => b.dimmer));
        // TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
        group.dimmer = commonState;
        const stateId = `${objId}.brightness`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the colorTemperature state
    if (whiteSpectrumBulbs.length > 0 &&
        (changedStateId == null ||
            changedStateId.endsWith("lightbulb.colorTemperature"))) {
        const commonState = whiteSpectrumBulbs.length > 0
            ? getCommonValue(whiteSpectrumBulbs.map(b => b.colorTemperature))
            : null;
        const stateId = `${objId}.colorTemperature`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the color state
    if (rgbBulbs.length > 0 &&
        (changedStateId == null || changedStateId.endsWith("lightbulb.color"))) {
        const commonState = rgbBulbs.length > 0
            ? getCommonValue(rgbBulbs.map(b => b.color))
            : null;
        const stateId = `${objId}.color`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the hue state
    if (rgbBulbs.length > 0 &&
        (changedStateId == null || changedStateId.endsWith("lightbulb.hue"))) {
        const commonState = rgbBulbs.length > 0
            ? getCommonValue(rgbBulbs.map(b => b.hue))
            : null;
        const stateId = `${objId}.hue`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the saturation state
    if (rgbBulbs.length > 0 &&
        (changedStateId == null ||
            changedStateId.endsWith("lightbulb.saturation"))) {
        const commonState = rgbBulbs.length > 0
            ? getCommonValue(rgbBulbs.map(b => b.saturation))
            : null;
        const stateId = `${objId}.saturation`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the position state
    if (groupBlinds.length > 0 &&
        (changedStateId == null || changedStateId.endsWith("blind.position"))) {
        const commonState = groupBlinds.length > 0
            ? getCommonValue(groupBlinds.map(b => b.position))
            : null;
        // TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
        group.position = commonState;
        const stateId = `${objId}.position`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
    // Try to update the plug on/off state
    if (groupPlugs.length > 0 &&
        (changedStateId == null || changedStateId.endsWith("plug.state"))) {
        const commonState = getCommonValue(groupPlugs.map(p => p.onOff));
        // TODO: Assigning null is not allowed as per the node-tradfri-client definitions but it works
        group.onOff = commonState;
        const stateId = `${objId}.state`;
        debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
}
exports.updateGroupStates = updateGroupStates;
// gets called when a lightbulb state gets updated
// we use this to sync group states because those are not advertised by the gateway
function syncGroupsWithState(id, state) {
    if (state && state.ack) {
        const instanceId = iobroker_objects_1.getInstanceId(id);
        if (instanceId == undefined)
            return;
        if (instanceId in session_1.session.devices && session_1.session.devices[instanceId] != null) {
            const accessory = session_1.session.devices[instanceId];
            updateMultipleGroupStates(accessory, id);
        }
    }
}
exports.syncGroupsWithState = syncGroupsWithState;
