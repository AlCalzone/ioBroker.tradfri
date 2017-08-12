"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var object_polyfill_1 = require("./object-polyfill");
function getEnumValueAsName(enumeration, value) {
    for (var _i = 0, _a = object_polyfill_1.entries(enumeration); _i < _a.length; _i++) {
        var _b = _a[_i], id = _b[0], val = _b[1];
        if (val === value)
            return id;
    }
    return "";
}
exports.getEnumValueAsName = getEnumValueAsName;
//# sourceMappingURL=enums.js.map