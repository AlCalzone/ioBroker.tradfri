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
  Global: () => Global
});
var import_objects = __toModule(require("alcalzone-shared/objects"));
class Global {
  static get adapter() {
    return Global._adapter;
  }
  static set adapter(adapter) {
    Global._adapter = adapter;
  }
  static extend(adapter) {
    const ret = adapter;
    ret.createOwnStateAsync = async (id, initialValue, ack = true, commonType = "mixed") => {
      await ret.setObjectAsync(id, {
        type: "state",
        common: {
          name: id,
          role: "value",
          type: commonType,
          read: true,
          write: true
        },
        native: {}
      });
      if (initialValue != void 0)
        await ret.setStateAsync(id, initialValue, ack);
    };
    ret.createOwnStateExAsync = async (id, obj, initialValue, ack = true) => {
      await ret.setObjectAsync(id, obj);
      if (initialValue != void 0)
        await ret.setStateAsync(id, initialValue, ack);
    };
    return ret;
  }
  static log(message, level = "info") {
    if (!Global.adapter)
      return;
    if (level === "silly" && !(level in Global._adapter.log))
      level = "debug";
    Global._adapter.log[level](message);
  }
  static $(id) {
    return Global._adapter.getForeignObjectAsync(id);
  }
  static async $$(pattern, type, role) {
    const objects = await Global._adapter.getForeignObjectsAsync(pattern, type);
    if (role) {
      return (0, import_objects.filter)(objects, (o) => o.common.role === role);
    } else {
      return objects;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Global
});
//# sourceMappingURL=global.js.map
