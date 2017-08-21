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
var LightSetting = (function (_super) {
    __extends(LightSetting, _super);
    function LightSetting(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["5706", "color", "f1e0b5"],
            ["5707", "UNKNOWN1", 0],
            ["5708", "UNKNOWN2", 0],
            ["5709", "colorX", 0],
            ["5710", "colorY", 0],
            ["5711", "UNKNOWN3", 0],
            ["5851", "dimmer", 0],
            ["5850", "onOff", false]])) || this;
    }
    return LightSetting;
}(ipsoDevice_1.default));
exports.default = LightSetting;
//# sourceMappingURL=lightSetting.js.map