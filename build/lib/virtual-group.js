"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_polyfill_1 = require("./object-polyfill");
class VirtualGroup {
    constructor(instanceId) {
        this.instanceId = instanceId;
        this.onOff = false; // <bool>
        this.dimmer = 0; // <int> [0..254]
        this.colorX = 0; // int
        this.transitionTime = 0; // <float>
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
