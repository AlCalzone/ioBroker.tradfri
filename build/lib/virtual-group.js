var __create = Object.create;
var __defProp = Object.defineProperty;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
var __exportStar = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
  }
  return target;
};
var __toModule = (module2) => {
  return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
};
__markAsModule(exports);
__export(exports, {
  VirtualGroup: () => VirtualGroup
});
var import_objects = __toModule(require("alcalzone-shared/objects"));
var import_node_tradfri_client = __toModule(require("node-tradfri-client"));
var import_light = __toModule(require("node-tradfri-client/build/lib/light"));
class VirtualGroup {
  constructor(instanceId) {
    this.instanceId = instanceId;
  }
  merge(operation) {
    for (const [prop, val] of (0, import_objects.entries)(operation)) {
      if (this.hasOwnProperty(prop))
        this[prop] = val;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VirtualGroup
});
//# sourceMappingURL=virtual-group.js.map
