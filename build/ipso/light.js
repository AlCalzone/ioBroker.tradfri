"use strict";
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
const conversions_1 = require("../lib/conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
class Light extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.color = "f1e0b5"; // hex string
        this.UNKNOWN1 = 0; // ???
        this.UNKNOWN2 = 0; // ???
        this.colorX = 0; // int
        this.colorY = 0; // int
        this.UNKNOWN3 = 0; // ???
        this.transitionTime = 0.5; // <float>
        this.cumulativeActivePower = 0.0; // <float>
        this.dimmer = 0; // <int> [0..254]
        this.onOff = false;
        this.onTime = 0; // <int>
        this.powerFactor = 0.0; // <float>
        this.unit = "";
    }
}
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
