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
var operations_exports = {};
__export(operations_exports, {
  operateVirtualGroup: () => operateVirtualGroup,
  renameDevice: () => renameDevice,
  renameGroup: () => renameGroup,
  stopBlinds: () => stopBlinds
});
var import_node_tradfri_client = require("node-tradfri-client");
var import_virtual_group = require("../lib/virtual-group");
var import_session = require("./session");
async function operateVirtualGroup(group, operation) {
  if (group.deviceIDs == void 0)
    return;
  if ("position" in operation) {
    const blindAccessories = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((dev) => dev != null && dev.type === import_node_tradfri_client.AccessoryTypes.blind);
    for (const acc of blindAccessories) {
      await import_session.session.tradfri.operateBlind(acc, operation);
    }
  } else if ("fanMode" in operation || "fanSpeed" in operation || "statusLEDs" in operation || "controlsLocked" in operation) {
    const apAccessories = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((dev) => dev != null && dev.type === import_node_tradfri_client.AccessoryTypes.airPurifier);
    for (const acc of apAccessories) {
      await import_session.session.tradfri.operateAirPurifier(acc, operation);
    }
  } else {
    const lightbulbAccessories = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((dev) => dev != null && dev.type === import_node_tradfri_client.AccessoryTypes.lightbulb);
    const plugAccessories = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((dev) => dev != null && dev.type === import_node_tradfri_client.AccessoryTypes.plug);
    if ("onOff" in operation || "dimmer" in operation) {
      for (const acc of plugAccessories) {
        await import_session.session.tradfri.operatePlug(acc, operation);
      }
    }
    for (const acc of lightbulbAccessories) {
      await import_session.session.tradfri.operateLight(acc, operation);
    }
  }
  if (group instanceof import_virtual_group.VirtualGroup) {
    group.merge(operation);
  }
}
async function stopBlinds(group) {
  if (group.deviceIDs == void 0)
    return;
  const blindAccessories = group.deviceIDs.map((id) => import_session.session.devices[id]).filter((dev) => dev != null && dev.type === import_node_tradfri_client.AccessoryTypes.blind);
  for (const acc of blindAccessories) {
    await acc.blindList[0].stop();
  }
}
function renameDevice(accessory, newName) {
  const newAccessory = accessory.clone();
  newAccessory.name = newName;
  return import_session.session.tradfri.updateDevice(newAccessory);
}
function renameGroup(group, newName) {
  const newGroup = group.clone();
  newGroup.name = newName;
  return import_session.session.tradfri.updateGroup(newGroup);
}
module.exports = __toCommonJS(operations_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  operateVirtualGroup,
  renameDevice,
  renameGroup,
  stopBlinds
});
//# sourceMappingURL=operations.js.map
