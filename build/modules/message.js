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
var message_exports = {};
__export(message_exports, {
  onMessage: () => onMessage
});
var import_objects = require("alcalzone-shared/objects");
var import_typeguards = require("alcalzone-shared/typeguards");
var import_node_tradfri_client = require("node-tradfri-client");
var import_global = require("../lib/global");
var import_iobroker_objects = require("../lib/iobroker-objects");
var import_virtual_group = require("../lib/virtual-group");
var import_groups = require("./groups");
var import_session = require("./session");
const onMessage = async (obj) => {
  function respond(response) {
    if (obj.callback)
      import_global.Global.adapter.sendTo(obj.from, obj.command, response, obj.callback);
  }
  const responses = {
    ACK: { error: null },
    OK: { error: null, result: "ok" },
    ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
    MISSING_PARAMETER: (paramName) => {
      return { error: 'missing parameter "' + paramName + '"!' };
    },
    COMMAND_RUNNING: { error: "command running" },
    RESULT: (result) => ({ error: null, result }),
    ERROR: (error) => ({ error })
  };
  function requireParams(...params) {
    for (const param of params) {
      if (!(obj.message && obj.message.hasOwnProperty(param))) {
        respond(responses.MISSING_PARAMETER(param));
        return false;
      }
    }
    return true;
  }
  if (obj) {
    switch (obj.command) {
      case "request": {
        if (!requireParams("path"))
          return;
        const params = obj.message;
        params.method = params.method || "get";
        if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
          respond({
            error: `unsupported request method "${params.method}"`
          });
          return;
        }
        import_global.Global.log(`custom coap request: ${params.method.toUpperCase()} "${params.path}"`);
        const resp = await import_session.session.tradfri.request(params.path, params.method, params.payload);
        respond(responses.RESULT(resp));
        return;
      }
      case "addVirtualGroup": {
        const nextID = Math.max(0, ...Object.keys(import_session.session.virtualGroups).map((k) => +k)) + 1;
        const newGroup = new import_virtual_group.VirtualGroup(nextID);
        newGroup.name = `virtual group ${nextID}`;
        import_session.session.virtualGroups[nextID] = newGroup;
        (0, import_groups.extendVirtualGroup)(newGroup);
        respond(responses.RESULT(nextID));
        return;
      }
      case "editVirtualGroup": {
        if (!requireParams("id"))
          return;
        const params = obj.message;
        const id = parseInt(params.id, 10);
        if (!(id in import_session.session.virtualGroups)) {
          respond({ error: `no virtual group with ID ${id} found!` });
          return;
        }
        const group = import_session.session.virtualGroups[id];
        if (params.deviceIDs != null && (0, import_typeguards.isArray)(params.deviceIDs)) {
          group.deviceIDs = params.deviceIDs.map((d) => parseInt(d, 10)).filter((d) => !isNaN(d));
        }
        if (typeof params.name === "string" && params.name.length > 0) {
          group.name = params.name;
        }
        (0, import_groups.extendVirtualGroup)(group);
        (0, import_groups.updateGroupStates)(group);
        respond(responses.OK);
        return;
      }
      case "deleteVirtualGroup": {
        if (!requireParams("id"))
          return;
        const params = obj.message;
        const id = parseInt(params.id, 10);
        if (!(id in import_session.session.virtualGroups)) {
          respond({ error: `no virtual group with ID ${id} found!` });
          return;
        }
        const group = import_session.session.virtualGroups[id];
        const channel = (0, import_iobroker_objects.calcGroupName)(group);
        await import_global.Global.adapter.deleteChannel(channel);
        delete import_session.session.virtualGroups[id];
        respond(responses.OK);
        return;
      }
      case "getGroups": {
        const params = obj.message;
        const groupType = params.type || "real";
        if (["real", "virtual", "both"].indexOf(groupType) === -1) {
          respond(responses.ERROR(`group type must be "real", "virtual" or "both"`));
          return;
        }
        const ret = {};
        if (groupType === "real" || groupType === "both") {
          for (const [id, group] of (0, import_objects.entries)(import_session.session.groups)) {
            ret[id] = {
              id,
              name: group.group.name,
              deviceIDs: group.group.deviceIDs,
              type: "real"
            };
          }
        }
        if (groupType === "virtual" || groupType === "both") {
          for (const [id, group] of (0, import_objects.entries)(import_session.session.virtualGroups)) {
            ret[id] = {
              id,
              name: group.name || "Unbenannte Gruppe",
              deviceIDs: group.deviceIDs || [],
              type: "virtual"
            };
          }
        }
        respond(responses.RESULT(ret));
        return;
      }
      case "getDevices": {
        const params = obj.message;
        const deviceType = params.type || "all";
        const allowedDeviceTypes = [
          "lightbulb",
          "plug",
          "blind",
          "all"
        ];
        if (allowedDeviceTypes.indexOf(deviceType) === -1) {
          respond(responses.ERROR(`device type must be one of ${allowedDeviceTypes.map((t) => `"${t}"`).join(", ")}`));
          return;
        }
        const ret = {};
        const predicate = ([, device]) => deviceType === "all" ? allowedDeviceTypes.indexOf(import_node_tradfri_client.AccessoryTypes[device.type]) > -1 : deviceType === import_node_tradfri_client.AccessoryTypes[device.type];
        const selectedDevices = (0, import_objects.entries)(import_session.session.devices).filter(predicate);
        for (const [id, acc] of selectedDevices) {
          ret[id] = {
            id,
            name: acc.name,
            type: deviceType
          };
        }
        respond(responses.RESULT(ret));
        return;
      }
      case "getDevice": {
        if (!requireParams("id"))
          return;
        const params = obj.message;
        if (!(params.id in import_session.session.devices)) {
          respond(responses.ERROR(`device with id ${params.id} not found`));
          return;
        }
        const device = import_session.session.devices[params.id];
        const ret = {
          name: device.name,
          type: import_node_tradfri_client.AccessoryTypes[device.type]
        };
        if (ret.type === "lightbulb") {
          ret.spectrum = device.lightList[0].spectrum;
        }
        respond(responses.RESULT(ret));
        return;
      }
      default:
        respond(responses.ERROR_UNKNOWN_COMMAND);
        return;
    }
  }
};
module.exports = __toCommonJS(message_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  onMessage
});
//# sourceMappingURL=message.js.map
