"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function padStart(str, targetLen, fill = " ") {
    if (str != null && str.length >= targetLen)
        return str;
    if (fill == null && fill.length !== 1)
        throw new Error("fill must be a single char");
    let ret = str;
    while (ret.length < targetLen) {
        ret = fill + ret;
    }
    return ret;
}
exports.padStart = padStart;
//# sourceMappingURL=strings.js.map