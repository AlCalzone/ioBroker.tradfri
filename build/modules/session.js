"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Session {
    constructor() {
        /** dictionary of known devices */
        this.devices = {};
        /** dictionary of known groups */
        this.groups = {};
        /** dictionary of known virtual groups */
        this.virtualGroups = {};
        // dictionary of ioBroker objects
        this.objects = {};
    }
}
exports.Session = Session;
exports.session = new Session();
