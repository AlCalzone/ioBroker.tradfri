"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_polyfill_1 = require("./object-polyfill");
class VirtualGroup {
    constructor(instanceId) {
        this.instanceId = instanceId;
    }
    /**
     * Updates this virtual group's state with the changes contained in the given operation
     */
    merge(operation) {
        for (const [prop, val] of object_polyfill_1.entries(operation)) {
            if (this.hasOwnProperty(prop))
                this[prop] = val;
        }
    }
}
exports.VirtualGroup = VirtualGroup;
