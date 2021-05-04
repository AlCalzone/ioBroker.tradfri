var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  bury,
  dig
});
//# sourceMappingURL=object-polyfill.js.map
