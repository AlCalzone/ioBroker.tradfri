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
var Group = (function (_super) {
    __extends(Group, _super);
    function Group(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["5850", "onOff", false],
            ["5851", "dimmer", 0],
            ["9039", "sceneId", []],
            ["9018", "deviceIDs", [], function (obj) { return parseAccessoryLink(obj); }]])) || this;
    }
    return Group;
}(ipsoDevice_1.default));
exports.default = Group;
function parseAccessoryLink(link) {
    var hsLink = link["15002"];
    var deviceIDs = hsLink["9003"];
    return deviceIDs;
}
//# sourceMappingURL=group.js.map