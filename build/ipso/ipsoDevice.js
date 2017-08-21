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
// common base class for all devices
var IPSODevice = (function (_super) {
    __extends(IPSODevice, _super);
    function IPSODevice(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["9001", "name", ""],
            ["9002", "createdAt", 0],
            ["9003", "instanceId", ""]])) || this;
    }
    return IPSODevice;
}(ipsoObject_1.IPSOObject));
exports.default = IPSODevice;
//# sourceMappingURL=ipsoDevice.js.map