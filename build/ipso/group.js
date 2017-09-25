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
var Group = (function (_super) {
    __extends(Group, _super);
    function Group() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onOff = false; // <bool>
        _this.dimmer = 0; // <int> [0..254]
        // The transition time is not reported by the gateway
        // but it accepts it for a state change
        _this.transitionTime = 0; // <float>
        return _this;
    }
    return Group;
}(ipsoDevice_1.IPSODevice));
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], Group.prototype, "onOff", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    __metadata("design:type", Number)
], Group.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9039"),
    __metadata("design:type", Object)
], Group.prototype, "sceneId", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9018"),
    ipsoObject_1.deserializeWith(function (obj) { return parseAccessoryLink(obj); }),
    ipsoObject_1.serializeWith(function (ids) { return toAccessoryLink(ids); }),
    __metadata("design:type", Array)
], Group.prototype, "deviceIDs", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5712"),
    ipsoObject_1.serializeWith(conversions_1.serializers.transitionTime),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.transitionTime),
    __metadata("design:type", Number)
], Group.prototype, "transitionTime", void 0);
exports.Group = Group;
// TODO: Type annotation
function parseAccessoryLink(link) {
    var hsLink = link["15002"];
    var deviceIDs = hsLink["9003"];
    return deviceIDs;
}
function toAccessoryLink(ids) {
    return {
        15002: {
            9003: ids,
        },
    };
}
//# sourceMappingURL=group.js.map