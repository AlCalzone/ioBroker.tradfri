var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
  normalizeHexColor: () => normalizeHexColor
});
const hexColorRegex = /^[^a-zA-Z0-9]*([a-fA-F0-9]{6})$/;
function normalizeHexColor(color) {
  const match = hexColorRegex.exec(color);
  if (match && match.length > 1)
    return match[1];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  normalizeHexColor
});
//# sourceMappingURL=colors.js.map
