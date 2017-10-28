"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("./global");
function parsePayload(response) {
    switch (response.format) {
        case 0: // text/plain
        case null:// assume text/plain
            return response.payload.toString("utf-8");
        case 50:// application/json
            const json = response.payload.toString("utf-8");
            return JSON.parse(json);
        default:
            // dunno how to parse this
            global_1.Global.log(`unknown CoAP response format ${response.format}`, "warn");
            return response.payload;
    }
}
exports.parsePayload = parsePayload;
