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
var ipsoObject_1 = require("./ipsoObject");
// common base class for all devices
var IPSODevice = (function (_super) {
    __extends(IPSODevice, _super);
    function IPSODevice() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.name = "";
        _this.createdAt = 0;
        _this.instanceId = 0;
        return _this;
    }
    return IPSODevice;
}(ipsoObject_1.IPSOObject));
__decorate([
    ipsoObject_1.ipsoKey("9001"),
    __metadata("design:type", String)
], IPSODevice.prototype, "name", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9002"),
    __metadata("design:type", Number)
], IPSODevice.prototype, "createdAt", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9003"),
    __metadata("design:type", Number)
], IPSODevice.prototype, "instanceId", void 0);
exports.IPSODevice = IPSODevice;
//# sourceMappingURL=ipsoDevice.js.map