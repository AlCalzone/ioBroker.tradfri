"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("alcalzone-shared/objects");
class VirtualGroup {
    constructor(instanceId) {
        this.instanceId = instanceId;
    }
    /**
     * Updates this virtual group's state with the changes contained in the given operation
     */
    merge(operation) {
        for (const [prop, val] of objects_1.entries(operation)) {
            if (this.hasOwnProperty(prop))
                this[prop] = val;
        }
    }
}
exports.VirtualGroup = VirtualGroup;
