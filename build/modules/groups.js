var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);
var groups_exports = {};
__export(groups_exports, {
  extendGroup: () => extendGroup,
  extendVirtualGroup: () => extendVirtualGroup,
  syncGroupsWithState: () => syncGroupsWithState,
  updateGroupStates: () => updateGroupStates,
  updateMultipleGroupStates: () => updateMultipleGroupStates
});
var import_objects = require("alcalzone-shared/objects");
var import_node_tradfri_client = require("node-tradfri-client");
var import_global = require("../lib/global");
var import_iobroker_objects = require("../lib/iobroker-objects");
var import_math = require("../lib/math");
var import_object_polyfill = require("../lib/object-polyfill");
var import_virtual_group = require("../lib/virtual-group");
var import_session = require("./session");
function extendVirtualGroup(group) {
  const objId = (0, import_iobroker_objects.calcGroupId)(group);
  if (objId in import_session.session.objects) {
    const grpObj = import_session.session.objects[objId];
    let changed = false;
    const newCommon = (0, import_iobroker_objects.groupToCommon)(group);
    if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
      Object.assign(grpObj.common, newCommon);
      changed = true;
    }
    const newNative = (0, import_iobroker_objects.groupToNative)(group);
    if (JSON.stringify(grpObj.native) !== JSON.stringify(newNative)) {
      Object.assign(grpObj.native, newNative);
      changed = true;
    }
    if (changed)
      import_global.Global.adapter.setObject(objId, grpObj);
  } else {
    const devObj = {
      _id: objId,
      type: "channel",
      common: (0, import_iobroker_objects.groupToCommon)(group),
      native: (0, import_iobroker_objects.groupToNative)(group)
    };
    import_global.Global.adapter.setObject(objId, devObj);
    const stateObjs = {
      state: import_iobroker_objects.objectDefinitions.onOff(objId, "virtual group"),
      whenPowerRestored: import_iobroker_objects.objectDefinitions.whenPowerRestored(objId, "virtual group"),
      transitionDuration: import_iobroker_objects.objectDefinitions.transitionDuration(objId, "virtual group"),
      brightness: import_iobroker_objects.objectDefinitions.brightness(objId, "virtual group"),
      colorTemperature: import_iobroker_objects.objectDefinitions.colorTemperature(objId, "virtual group"),
      color: import_iobroker_objects.objectDefinitions.color(objId, "virtual group"),
      hue: import_iobroker_objects.objectDefinitions.hue(objId, "virtual group"),
      saturation: import_iobroker_objects.objectDefinitions.saturation(objId, "virtual group"),
      position: import_iobroker_objects.objectDefinitions.position(objId, "virtual group"),
      stopBlinds: import_iobroker_objects.objectDefinitions.stopBlinds(objId, "virtual group"),
      fanMode: import_iobroker_objects.objectDefinitions.fanMode(objId, "virtual group"),
      fanSpeed: import_iobroker_objects.objectDefinitions.fanSpeed(objId, "virtual group"),
      statusLEDs: import_iobroker_objects.objectDefinitions.statusLEDs(objId, "virtual group"),
      controlsLocked: import_iobroker_objects.objectDefinitions.controlsLocked(objId, "virtual group")
    };
    const createObjects = Object.keys(stateObjs).map((key) => {
      const obj = stateObjs[key];
      let initialValue = null;
      if (obj.native.path != null) {
        initialValue = (0, import_object_polyfill.dig)(group, obj.native.path);
      }
      return import_global.Global.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
    });
    Promise.all(createObjects);
  }
}
function extendGroup(group) {
  const objId = (0, import_iobroker_objects.calcGroupId)(group);
  if (objId in import_session.session.objects) {
    const grpObj = import_session.session.objects[objId];
    let changed = false;
    const newCommon = (0, import_iobroker_objects.groupToCommon)(group);
    if (JSON.stringify(grpObj.common) !== JSON.stringify(newCommon)) {
      Object.assign(grpObj.common, newCommon);
      changed = true;
    }
    const newNative = (0, import_iobroker_objects.groupToNative)(group);
    if (JSON.stringify(grpObj.native) !== JSON.stringify(newNative)) {
      Object.assign(grpObj.native, newNative);
      changed = true;
    }
    if (changed)
      import_global.Global.adapter.setObject(objId, grpObj);
    const stateObjs = (0, import_objects.filter)(import_session.session.objects, (obj) => obj._id.startsWith(objId) && obj.native && obj.native.path);
    for (const [id, obj] of (0, import_objects.entries)(stateObjs)) {
      try {
        let newValue = (0, import_object_polyfill.dig)(group, obj.native.path);
        if (typeof newValue === "function")
          continue;
        const roundToDigits = import_global.Global.adapter.config.roundToDigits;
        if (typeof roundToDigits === "number" && typeof newValue === "number") {
          newValue = (0, import_math.roundTo)(newValue, roundToDigits);
        }
        import_global.Global.adapter.setState(id, newValue != null ? newValue : null, true);
      } catch (e) {
      }
    }
  } else {
    const devObj = {
      _id: objId,
      type: "channel",
      common: (0, import_iobroker_objects.groupToCommon)(group),
      native: (0, import_iobroker_objects.groupToNative)(group)
    };
    import_global.Global.adapter.setObject(objId, devObj);
    const stateObjs = {
      activeScene: import_iobroker_objects.objectDefinitions.activeScene(objId, "group"),
      state: import_iobroker_objects.objectDefinitions.onOff(objId, "group"),
      transitionDuration: import_iobroker_objects.objectDefinitions.transitionDuration(objId, "group"),
      brightness: import_iobroker_objects.objectDefinitions.brightness(objId, "group"),
      colorTemperature: import_iobroker_objects.objectDefinitions.colorTemperature(objId, "group"),
      color: import_iobroker_objects.objectDefinitions.color(objId, "group"),
      hue: import_iobroker_objects.objectDefinitions.hue(objId, "group"),
      saturation: import_iobroker_objects.objectDefinitions.saturation(objId, "group"),
      position: import_iobroker_objects.objectDefinitions.position(objId, "group"),
      stopBlinds: import_iobroker_objects.objectDefinitions.stopBlinds(objId, "group")
    };
    const createObjects = Object.keys(stateObjs).map((key) => {
      const obj = stateObjs[key];
      let initialValue = null;
      if (obj.native.path != null) {
        initialValue = (0, import_object_polyfill.dig)(group, obj.native.path);
      }
      return import_global.Global.adapter.createOwnStateExAsync(obj._id, obj, initialValue);
    });
    Promise.all(createObjects);
  }
}
function getCommonValue(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1])
      return null;
  }
  return arr[0];
}
const updateTimers = {};
function debounce(id, action, timeout) {
  if (id in updateTimers)
    clearTimeout(updateTimers[id]);
  updateTimers[id] = setTimeout(() => {
    delete updateTimers[id];
    action();
  }, timeout);
}
async function updateGroupState(id, value) {
  const curState = await import_global.Global.adapter.getStateAsync(id);
  if (curState != null && value == null) {
    await import_global.Global.adapter.delStateAsync(id);
  } else if (curState !== value) {
    const roundToDigits = import_global.Global.adapter.config.roundToDigits;
    if (typeof roundToDigits === "number" && typeof value === "number") {
      value = (0, import_math.roundTo)(value, roundToDigits);
    }
    await import_global.Global.adapter.setStateAsync(id, value != null ? value : null, true);
  }
}
function updateMultipleGroupStates(changedAccessory, changedStateId) {
  const groupsToUpdate = (0, import_objects.values)(import_session.session.groups).map((g) => g.group).concat((0, import_objects.values)(import_session.session.virtualGroups)).filter((g) => changedAccessory == null || g.deviceIDs != void 0 && g.deviceIDs.indexOf(changedAccessory.instanceId) > -1);
  for (const group of groupsToUpdate) {
    updateGroupStates(group, changedStateId);
  }
}
function updateGroupStates(group, changedStateId) {
  var _a;
  if (group.deviceIDs == null)
    return;
  const objId = (0, import_iobroker_objects.calcGroupId)(group);
  const groupBulbs = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((a) => a != null && a.type === import_node_tradfri_client.AccessoryTypes.lightbulb).map((a) => a.lightList[0]);
  const groupBlinds = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((a) => a != null && a.type === import_node_tradfri_client.AccessoryTypes.blind).map((a) => a.blindList[0]);
  const groupPlugs = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((a) => a != null && a.type === import_node_tradfri_client.AccessoryTypes.plug).map((a) => a.plugList[0]);
  const groupAPs = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((a) => a != null && a.type === import_node_tradfri_client.AccessoryTypes.airPurifier).map((a) => a.airPurifierList[0]);
  const whiteSpectrumBulbs = groupBulbs.filter((b) => b.spectrum === "white");
  const rgbBulbs = groupBulbs.filter((b) => b.spectrum === "rgb");
  const debounceTimeout = 250;
  if (groupBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.state"))) {
    const commonState = getCommonValue(groupBulbs.map((b) => b.onOff));
    group.onOff = commonState;
    const stateId = `${objId}.state`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (group instanceof import_virtual_group.VirtualGroup && groupBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.whenPowerRestored"))) {
    const commonState = getCommonValue(groupBulbs.map((b) => b.whenPowerRestored));
    group.whenPowerRestored = commonState;
    const stateId = `${objId}.whenPowerRestored`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (groupBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.brightness"))) {
    const commonState = getCommonValue(groupBulbs.map((b) => b.dimmer));
    group.dimmer = commonState;
    const stateId = `${objId}.brightness`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (whiteSpectrumBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.colorTemperature"))) {
    const commonState = whiteSpectrumBulbs.length > 0 ? getCommonValue(whiteSpectrumBulbs.map((b) => b.colorTemperature)) : null;
    const stateId = `${objId}.colorTemperature`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (rgbBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.color"))) {
    const commonState = rgbBulbs.length > 0 ? getCommonValue(rgbBulbs.map((b) => b.color)) : null;
    const stateId = `${objId}.color`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (rgbBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.hue"))) {
    const commonState = rgbBulbs.length > 0 ? getCommonValue(rgbBulbs.map((b) => b.hue)) : null;
    const stateId = `${objId}.hue`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (rgbBulbs.length > 0 && (changedStateId == null || changedStateId.endsWith("lightbulb.saturation"))) {
    const commonState = rgbBulbs.length > 0 ? getCommonValue(rgbBulbs.map((b) => b.saturation)) : null;
    const stateId = `${objId}.saturation`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (groupBlinds.length > 0 && (changedStateId == null || changedStateId.endsWith("blind.position"))) {
    const commonState = groupBlinds.length > 0 ? getCommonValue(groupBlinds.map((b) => b.position)) : null;
    group.position = commonState;
    const stateId = `${objId}.position`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  if (groupPlugs.length > 0 && (changedStateId == null || changedStateId.endsWith("plug.state"))) {
    const commonState = getCommonValue(groupPlugs.map((p) => p.onOff));
    group.onOff = commonState;
    const stateId = `${objId}.state`;
    debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
  }
  for (const prop of [
    "fanMode",
    "fanSpeed",
    "statusLEDs",
    "controlsLocked"
  ]) {
    if (group instanceof import_virtual_group.VirtualGroup && groupAPs.length > 0 && (changedStateId == null || changedStateId.endsWith(`airPurifier.${prop}`))) {
      const commonState = (_a = getCommonValue(groupAPs.map((p) => p[prop]))) != null ? _a : null;
      group[prop] = commonState;
      const stateId = `${objId}.${prop}`;
      debounce(stateId, () => updateGroupState(stateId, commonState), debounceTimeout);
    }
  }
}
function syncGroupsWithState(id, state) {
  if (state && state.ack) {
    const instanceId = (0, import_iobroker_objects.getInstanceId)(id);
    if (instanceId == void 0)
      return;
    if (instanceId in import_session.session.devices && import_session.session.devices[instanceId] != null) {
      const accessory = import_session.session.devices[instanceId];
      updateMultipleGroupStates(accessory, id);
    }
  }
}
module.exports = __toCommonJS(groups_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  extendGroup,
  extendVirtualGroup,
  syncGroupsWithState,
  updateGroupStates,
  updateMultipleGroupStates
});
//# sourceMappingURL=groups.js.map
