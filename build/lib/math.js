var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
  clamp: () => clamp,
  roundTo: () => roundTo
});
function clamp(value, min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }
  if (value < min)
    return min;
  if (value > max)
    return max;
  return value;
}
function roundTo(value, digits) {
  const exp = Math.pow(10, digits);
  return Math.round(value * exp) / exp;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  clamp,
  roundTo
});
//# sourceMappingURL=math.js.map
