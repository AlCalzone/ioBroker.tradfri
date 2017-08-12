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
Object.defineProperty(exports, "__esModule", { value: true });
var ipsoDevice_1 = require("./ipsoDevice");
/** contains information about the gateway */
var GatewayDetails = (function (_super) {
    __extends(GatewayDetails, _super);
    function GatewayDetails(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["9023", "ntpServerUrl", ""],
            ["9029", "version", ""],
            ["9054", "updateState", 0],
            ["9055", "updateProgress", 100],
            ["9056", "updateDetailsURL", ""],
            ["9059", "currentTimestamp", 0],
            ["9060", "UNKNOWN1", ""],
            ["9061", "commissioningMode", 0],
            ["9062", "UNKNOWN2", 0],
            ["9066", "updatePriority", 0],
            ["9069", "updateAcceptedTimestamp", 0],
            ["9071", "timeSource", -1],
            ["9072", "UNKNOWN3", 0],
            ["9073", "UNKNOWN4", 0],
            ["9074", "UNKNOWN5", 0],
            ["9075", "UNKNOWN6", 0],
            ["9076", "UNKNOWN7", 0],
            ["9077", "UNKNOWN8", 0],
            ["9078", "UNKNOWN9", 0],
            ["9079", "UNKNOWN10", 0],
            ["9080", "UNKNOWN11", 0],
            ["9081", "UNKNOWN12", ""],
            // are those used?
            ["9032", "FORCE_CHECK_OTA_UPDATE", ""],
            ["9035", "name", ""]])) || this;
    }
    return GatewayDetails;
}(ipsoDevice_1.default));
exports.default = GatewayDetails;
//# sourceMappingURL=gatewayDetails.js.map