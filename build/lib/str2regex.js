var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
  str2regex: () => str2regex
});
function str2regex(pattern) {
  return new RegExp(pattern.replace(/\\/g, "\\\\").replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\!/g, "?!"));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  str2regex
});
//# sourceMappingURL=str2regex.js.map
