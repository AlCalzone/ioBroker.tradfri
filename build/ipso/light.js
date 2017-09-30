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
var conversions_1 = require("../lib/conversions");
var ipsoDevice_1 = require("./ipsoDevice");
var ipsoObject_1 = require("./ipsoObject");
var Light = (function (_super) {
    __extends(Light, _super);
    function Light() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.color = "f1e0b5"; // hex string
        _this.UNKNOWN1 = 0; // ???
        _this.UNKNOWN2 = 0; // ???
        _this.colorX = 0; // int
        _this.colorY = 0; // int
        _this.UNKNOWN3 = 0; // ???
        _this.transitionTime = 0.5; // <float>
        _this.cumulativeActivePower = 0.0; // <float>
        _this.dimmer = 0; // <int> [0..254]
        _this.onOff = false;
        _this.onTime = 0; // <int>
        _this.powerFactor = 0.0; // <float>
        _this.unit = "";
        return _this;
    }
    return Light;
}(ipsoDevice_1.IPSODevice));
__decorate([
    ipsoObject_1.ipsoKey("5706"),
    __metadata("design:type", String)
], Light.prototype, "color", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5707"),
    __metadata("design:type", Number)
], Light.prototype, "UNKNOWN1", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5708"),
    __metadata("design:type", Number)
], Light.prototype, "UNKNOWN2", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5709"),
    ipsoObject_1.serializeWith(conversions_1.serializers.color),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.color),
    __metadata("design:type", Number)
], Light.prototype, "colorX", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5710"),
    __metadata("design:type", Number)
], Light.prototype, "colorY", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5711"),
    __metadata("design:type", Number)
], Light.prototype, "UNKNOWN3", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5712"),
    ipsoObject_1.required,
    ipsoObject_1.serializeWith(conversions_1.serializers.transitionTime),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.transitionTime),
    __metadata("design:type", Number)
], Light.prototype, "transitionTime", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5805"),
    __metadata("design:type", Number)
], Light.prototype, "cumulativeActivePower", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    __metadata("design:type", Number)
], Light.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], Light.prototype, "onOff", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5852"),
    __metadata("design:type", Number)
], Light.prototype, "onTime", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5820"),
    __metadata("design:type", Number)
], Light.prototype, "powerFactor", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5701"),
    __metadata("design:type", String)
], Light.prototype, "unit", void 0);
exports.Light = Light;
//# sourceMappingURL=light.js.map