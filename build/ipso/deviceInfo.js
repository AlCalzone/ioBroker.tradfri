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
var ipsoObject_1 = require("./ipsoObject");
// contains information about a specific device
var DeviceInfo = (function (_super) {
    __extends(DeviceInfo, _super);
    function DeviceInfo(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["9", "battery", 0],
            ["3", "firmwareVersion", ""],
            ["0", "manufacturer", ""],
            ["1", "modelNumber", ""],
            ["6", "power", 0],
            ["2", "serialNumber", ""]])) || this;
    }
    return DeviceInfo;
}(ipsoObject_1.IPSOObject));
exports.default = DeviceInfo;
//# sourceMappingURL=deviceInfo.js.map