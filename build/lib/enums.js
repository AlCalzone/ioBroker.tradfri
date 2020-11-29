"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnumValueAsName = void 0;
const objects_1 = require("alcalzone-shared/objects");
function getEnumValueAsName(enumeration, value) {
    for (const [id, val] of objects_1.entries(enumeration)) {
        if (val === value)
            return id;
    }
    return "";
}
exports.getEnumValueAsName = getEnumValueAsName;
