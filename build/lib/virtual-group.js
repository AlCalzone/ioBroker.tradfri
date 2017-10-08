"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("./global");
class VirtualGroup {
    constructor(instanceId) {
        this.instanceId = instanceId;
        this.onOff = false; // <bool>
        this.dimmer = 0; // <int> [0..254]
        this.colorX = 0; // int
        this.transitionTime = 0; // <float>
    }
    serialize(references) {
        const ret = {};
        for (const id of this.deviceIDs) {
            if (!(id in references)) {
                global_1.Global.log(`VirtualGroup > cannot serialize command for accessory with id ${id}`, "warn");
                continue;
            }
            // get the reference value and a clone to modify
            const oldAcc = references[id];
            const newAcc = oldAcc.clone();
            // get the light to modify
            const light = newAcc.lightList[0];
            light.merge({
                onOff: this.onOff,
                dimmer: this.dimmer,
                colorX: this.colorX,
                colorY: 27000,
                transitionTime: this.transitionTime,
            });
            // and serialize the payload
            ret[id] = newAcc.serialize(oldAcc);
        }
        return ret;
    }
}
exports.VirtualGroup = VirtualGroup;
//# sourceMappingURL=virtual-group.js.map