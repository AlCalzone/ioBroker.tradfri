"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var ipsoDevice_1 = require("./ipsoDevice");
var lightSetting_1 = require("./lightSetting");
var ipsoObject_1 = require("./ipsoObject");
var Scene = (function (_super) {
    __extends(Scene, _super);
    function Scene() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isActive = false; // <bool>
        _this.isPredefined = true; // <bool>
        _this.sceneIndex = 0; // <int>
        _this.useCurrentLightSettings = false; // <bool>
        return _this;
    }
    return Scene;
}(ipsoDevice_1.IPSODevice));
__decorate([
    ipsoObject_1.ipsoKey("9058"),
    __metadata("design:type", Boolean)
], Scene.prototype, "isActive", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9068"),
    __metadata("design:type", Boolean)
], Scene.prototype, "isPredefined", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15013"),
    ipsoObject_1.deserializeWith(function (obj) { return new lightSetting_1.LightSetting().parse(obj); }),
    __metadata("design:type", Array)
], Scene.prototype, "lightSettings", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9057"),
    __metadata("design:type", Number)
], Scene.prototype, "sceneIndex", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9070"),
    __metadata("design:type", Boolean)
], Scene.prototype, "useCurrentLightSettings", void 0);
exports.default = Scene;
//# sourceMappingURL=scene.js.map