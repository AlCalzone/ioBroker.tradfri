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
var Notification = (function (_super) {
    __extends(Notification, _super);
    function Notification(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        return _super.apply(this, [sourceObj].concat(properties, [["9015", "event", 0],
            ["9017", "details", {}, function (arr) { return parseNotificationDetails(arr); }],
            ["9014", "state", 0]])) || this;
    }
    return Notification;
}(ipsoDevice_1.default));
exports.default = Notification;
function parseNotificationDetails(kvpList) {
    var ret = {};
    for (var _i = 0, kvpList_1 = kvpList; _i < kvpList_1.length; _i++) {
        var kvp = kvpList_1[_i];
        var parts = kvp.split("=");
        ret[parts[0]] = parts[1];
    }
    return ret;
}
//# sourceMappingURL=notification.js.map