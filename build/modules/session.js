var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {get: all[name], enumerable: true});
};
__markAsModule(exports);
__export(exports, {
  Session: () => Session,
  session: () => session
});
class Session {
  constructor() {
    this.devices = {};
    this.groups = {};
    this.virtualGroups = {};
    this.objects = {};
  }
}
const session = new Session();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Session,
  session
});
//# sourceMappingURL=session.js.map
