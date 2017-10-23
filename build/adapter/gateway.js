"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Gateway {
    constructor() {
        /** dictionary of COAP observers */
        this.observers = [];
        /** dictionary of known devices */
        this.devices = {};
        /** dictionary of known groups */
        this.groups = {};
        /** dictionary of known virtual groups */
        this.virtualGroups = {};
    }
    /** Common URL for all requests */
    get requestBase() { return this._requestBase; }
    set requestBase(value) { this._requestBase = value; }
}
exports.Gateway = Gateway;
exports.gateway = new Gateway();
