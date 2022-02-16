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
var custom_subscriptions_exports = {};
__export(custom_subscriptions_exports, {
  applyCustomObjectSubscriptions: () => applyCustomObjectSubscriptions,
  applyCustomStateSubscriptions: () => applyCustomStateSubscriptions,
  clearCustomSubscriptions: () => clearCustomSubscriptions,
  subscribeObjects: () => subscribeObjects,
  subscribeStates: () => subscribeStates,
  unsubscribeObjects: () => unsubscribeObjects,
  unsubscribeStates: () => unsubscribeStates
});
var import_global = require("../lib/global");
var import_str2regex = require("../lib/str2regex");
const customStateSubscriptions = {
  subscriptions: /* @__PURE__ */ new Map(),
  counter: 0
};
const customObjectSubscriptions = {
  subscriptions: /* @__PURE__ */ new Map(),
  counter: 0
};
function checkPattern(pattern) {
  try {
    if (typeof pattern === "string") {
      return (0, import_str2regex.str2regex)(pattern);
    } else if (pattern instanceof RegExp) {
      return pattern;
    } else {
      throw new Error("The pattern must be regex or string");
    }
  } catch (e) {
    import_global.Global.log("cannot subscribe with this pattern. reason: " + e, "error");
  }
}
function applyCustomStateSubscriptions(id, state) {
  try {
    for (const sub of customStateSubscriptions.subscriptions.values()) {
      if (sub && sub.pattern && sub.pattern.test(id) && typeof sub.callback === "function") {
        sub.callback(id, state);
      }
    }
  } catch (e) {
    import_global.Global.log("error handling custom sub: " + e);
  }
}
function applyCustomObjectSubscriptions(id, obj) {
  try {
    for (const sub of customObjectSubscriptions.subscriptions.values()) {
      if (sub && sub.pattern && sub.pattern.test(id) && typeof sub.callback === "function") {
        sub.callback(id, obj);
      }
    }
  } catch (e) {
    import_global.Global.log("error handling custom sub: " + e);
  }
}
function subscribeStates(pattern, callback) {
  const checkedPattern = checkPattern(pattern);
  if (checkedPattern == void 0)
    return;
  const newCounter = ++customStateSubscriptions.counter;
  const id = "" + newCounter;
  customStateSubscriptions.subscriptions.set(id, {
    pattern: checkedPattern,
    callback
  });
  return id;
}
function unsubscribeStates(id) {
  if (customStateSubscriptions.subscriptions.has(id)) {
    customStateSubscriptions.subscriptions.delete(id);
  }
}
function subscribeObjects(pattern, callback) {
  const checkedPattern = checkPattern(pattern);
  if (checkedPattern == void 0)
    return;
  const newCounter = ++customObjectSubscriptions.counter;
  const id = "" + newCounter;
  customObjectSubscriptions.subscriptions.set(id, {
    pattern: checkedPattern,
    callback
  });
  return id;
}
function unsubscribeObjects(id) {
  if (customObjectSubscriptions.subscriptions.has(id)) {
    customObjectSubscriptions.subscriptions.delete(id);
  }
}
function clearCustomSubscriptions() {
  customStateSubscriptions.subscriptions.clear();
  customObjectSubscriptions.subscriptions.clear();
}
module.exports = __toCommonJS(custom_subscriptions_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyCustomObjectSubscriptions,
  applyCustomStateSubscriptions,
  clearCustomSubscriptions,
  subscribeObjects,
  subscribeStates,
  unsubscribeObjects,
  unsubscribeStates
});
//# sourceMappingURL=custom-subscriptions.js.map
