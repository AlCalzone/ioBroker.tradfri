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
var deviceInfo_1 = require("./deviceInfo");
var ipsoDevice_1 = require("./ipsoDevice");
var ipsoObject_1 = require("./ipsoObject");
var light_1 = require("./light");
// list of known endpoints defined on the gateway
var AccessoryTypes;
(function (AccessoryTypes) {
    AccessoryTypes[AccessoryTypes["remote"] = 0] = "remote";
    AccessoryTypes[AccessoryTypes["lightbulb"] = 2] = "lightbulb";
    // TODO: find out the other ones
})(AccessoryTypes = exports.AccessoryTypes || (exports.AccessoryTypes = {}));
var Accessory = (function (_super) {
    __extends(Accessory, _super);
    function Accessory() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = AccessoryTypes.remote;
        _this.deviceInfo = null;
        _this.alive = false;
        _this.lastSeen = 0;
        _this.otaUpdateState = 0; // boolean?
        return _this;
    }
    return Accessory;
}(ipsoDevice_1.IPSODevice));
__decorate([
    ipsoObject_1.ipsoKey("5750"),
    __metadata("design:type", Number)
], Accessory.prototype, "type", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3"),
    ipsoObject_1.deserializeWith(function (obj) { return new deviceInfo_1.DeviceInfo().parse(obj); }),
    __metadata("design:type", deviceInfo_1.DeviceInfo)
], Accessory.prototype, "deviceInfo", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9019"),
    __metadata("design:type", Boolean)
], Accessory.prototype, "alive", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9020"),
    __metadata("design:type", Number)
], Accessory.prototype, "lastSeen", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3311"),
    ipsoObject_1.deserializeWith(function (obj) { return new light_1.Light().parse(obj); }),
    __metadata("design:type", Array)
], Accessory.prototype, "lightList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3312"),
    ipsoObject_1.deserializeWith(function (obj) { return new ipsoDevice_1.IPSODevice().parse(obj); }),
    __metadata("design:type", Array)
], Accessory.prototype, "plugList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3300"),
    ipsoObject_1.deserializeWith(function (obj) { return new ipsoDevice_1.IPSODevice().parse(obj); }),
    __metadata("design:type", Array)
], Accessory.prototype, "sensorList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15009"),
    ipsoObject_1.deserializeWith(function (obj) { return new ipsoDevice_1.IPSODevice().parse(obj); }),
    __metadata("design:type", Array)
], Accessory.prototype, "switchList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], Accessory.prototype, "otaUpdateState", void 0);
exports.Accessory = Accessory;
//# sourceMappingURL=accessory.js.map