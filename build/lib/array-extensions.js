var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
  except: () => except,
  firstOrDefault: () => firstOrDefault,
  intersect: () => intersect,
  range: () => range
});
function intersect(a, b) {
  let ai = 0;
  let bi = 0;
  const ret = [];
  while (ai < a.length && bi < b.length) {
    if (a[ai] < b[bi])
      ai++;
    else if (a[ai] > b[bi])
      bi++;
    else {
      ret.push(a[ai]);
      ai++;
      bi++;
    }
  }
  return ret;
}
function except(a, b) {
  return a.filter((el) => b.indexOf(el) === -1);
}
function range(min, max) {
  if (min > max)
    [max, min] = [min, max];
  const N = max - min + 1;
  return Array.from(new Array(N), (_, index) => index + min);
}
function firstOrDefault(arr, filter) {
  for (const item of arr) {
    if (filter(item))
      return item;
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  except,
  firstOrDefault,
  intersect,
  range
});
//# sourceMappingURL=array-extensions.js.map
