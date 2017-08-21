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
var Scene = (function (_super) {
    __extends(Scene, _super);
    function Scene(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["9058", "isActive", false],
            ["9068", "isPredefined", true],
            ["15013", "lightSettings", []],
            ["9057", "sceneIndex", 0],
            ["9070", "useCurrentLightSettings", false]])) || this;
    }
    return Scene;
}(ipsoDevice_1.default));
exports.default = Scene;
//# sourceMappingURL=scene.js.map