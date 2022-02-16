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
var object_polyfill_exports = {};
__export(object_polyfill_exports, {
  bury: () => bury,
  dig: () => dig
});
function dig(object, path) {
  function _dig(obj, pathArr) {
    if (!pathArr.length)
      return obj;
    let propName = pathArr.shift();
    if (/\[\d+\]/.test(propName)) {
      propName = +propName.slice(1, -1);
    }
    return _dig(obj[propName], pathArr);
  }
  return _dig(object, path.split("."));
}
function bury(object, path, value) {
  function _bury(obj, pathArr) {
    if (pathArr.length === 1) {
      obj[pathArr[0]] = value;
      return;
    }
    let propName = pathArr.shift();
    if (/\[\d+\]/.test(propName)) {
      propName = +propName.slice(1, -1);
    }
    _bury(obj[propName], pathArr);
  }
  _bury(object, path.split("."));
}
module.exports = __toCommonJS(object_polyfill_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bury,
  dig
});
//# sourceMappingURL=object-polyfill.js.map
