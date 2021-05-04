var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
  padStart: () => padStart
});
function padStart(str, targetLen, fill = " ") {
  if (str != null && str.length >= targetLen)
    return str;
  if (fill == null || fill.length < 1)
    throw new Error("fill must be at least one char");
  const missingLength = targetLen - str.length;
  const repeats = Math.ceil(missingLength / fill.length);
  return fill.repeat(repeats).substr(0, missingLength) + str;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  padStart
});
//# sourceMappingURL=strings.js.map
