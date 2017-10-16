"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_polyfill_1 = require("./object-polyfill");
function getEnumValueAsName(enumeration, value) {
    for (const [id, val] of object_polyfill_1.entries(enumeration)) {
        if (val === value)
            return id;
    }
    return "";
}
exports.getEnumValueAsName = getEnumValueAsName;
