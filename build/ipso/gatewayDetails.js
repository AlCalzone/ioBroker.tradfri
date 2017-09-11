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
var ipsoObject_1 = require("./ipsoObject");
/** contains information about the gateway */
var GatewayDetails = (function (_super) {
    __extends(GatewayDetails, _super);
    function GatewayDetails() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.ntpServerUrl = "";
        _this.version = "";
        _this.updateState = 0; // => which enum?
        _this.updateProgress = 100; // <int>
        _this.updateDetailsURL = ""; // <string> => what is this?
        _this.currentTimestamp = 0; // <long>
        _this.UNKNOWN1 = ""; // <string> => something to do with commissioning? XML-Date
        _this.commissioningMode = 0; // <int> => which enum?
        _this.UNKNOWN2 = 0; // <int> => something more with commissioning?
        _this.updatePriority = updatePriority.normal;
        _this.updateAcceptedTimestamp = 0; // <int>
        _this.timeSource = -1; // <int>
        _this.UNKNOWN3 = 0; // <int/bool> => what is this?
        _this.UNKNOWN4 = 0; // <int/bool> => what is this?
        _this.UNKNOWN5 = 0; // <int/bool> => what is this?
        _this.UNKNOWN6 = 0; // <int/bool> => what is this?
        _this.UNKNOWN7 = 0; // <int/bool> => what is this?
        _this.UNKNOWN8 = 0; // <int/bool> => what is this?
        _this.UNKNOWN9 = 0; // <int/bool> => what is this?
        _this.UNKNOWN10 = 0; // <int/bool> => what is this?
        _this.UNKNOWN11 = 0; // <int/bool> => what is this?
        _this.UNKNOWN12 = ""; // some kind of hex code
        // are those used?
        _this.FORCE_CHECK_OTA_UPDATE = "";
        _this.name = "";
        return _this;
    }
    return GatewayDetails;
}(ipsoDevice_1.IPSODevice));
__decorate([
    ipsoObject_1.ipsoKey("9023"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "ntpServerUrl", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9029"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "version", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateState", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9055"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateProgress", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9056"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "updateDetailsURL", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9059"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "currentTimestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9060"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "UNKNOWN1", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9061"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "commissioningMode", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9062"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN2", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9066"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updatePriority", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9069"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateAcceptedTimestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9071"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "timeSource", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9072"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN3", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9073"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN4", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9074"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN5", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9075"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN6", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9076"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN7", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9077"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN8", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9078"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN9", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9079"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN10", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9080"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN11", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9081"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "UNKNOWN12", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9032"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "FORCE_CHECK_OTA_UPDATE", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9035"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "name", void 0);
exports.GatewayDetails = GatewayDetails;
var updatePriority;
(function (updatePriority) {
    updatePriority[updatePriority["normal"] = 0] = "normal";
    updatePriority[updatePriority["critical"] = 1] = "critical";
    updatePriority[updatePriority["required"] = 2] = "required";
    updatePriority[updatePriority["forced"] = 5] = "forced";
})(updatePriority = exports.updatePriority || (exports.updatePriority = {}));
//# sourceMappingURL=gatewayDetails.js.map