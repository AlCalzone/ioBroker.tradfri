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
var deviceInfo_1 = require("./deviceInfo");
var ipsoDevice_1 = require("./ipsoDevice");
var light_1 = require("./light");
var Accessory = (function (_super) {
    __extends(Accessory, _super);
    function Accessory(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["5750", "type", 0],
            ["3", "deviceInfo", null, function (obj) { return new deviceInfo_1.default(obj); }],
            ["9019", "alive", false],
            ["9020", "lastSeen", 0],
            ["3311", "lightList", [], function (obj) { return new light_1.default(obj); }],
            ["3312", "plugList", [], function (obj) { return new ipsoDevice_1.default(obj); }],
            ["3300", "sensorList", [], function (obj) { return new ipsoDevice_1.default(obj); }],
            ["15009", "switchList", [], function (obj) { return new ipsoDevice_1.default(obj); }],
            ["9054", "otaUpdateState", 0]])) || this;
    }
    return Accessory;
}(ipsoDevice_1.default));
exports.default = Accessory;
//# sourceMappingURL=accessory.js.map