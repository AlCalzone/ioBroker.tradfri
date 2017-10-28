"use strict";
/**
 * Provides operations for Tradfri devices using the CoAP layer
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_coap_client_1 = require("node-coap-client");
const accessory_1 = require("../ipso/accessory");
const endpoints_1 = require("../ipso/endpoints");
const global_1 = require("../lib/global");
const virtual_group_1 = require("../lib/virtual-group");
const gateway_1 = require("./gateway");
/**
 * Sets some properties on a lightbulb
 * @param accessory The parent accessory of the lightbulb
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
function operateLight(accessory, operation) {
    return __awaiter(this, void 0, void 0, function* () {
        if (accessory.type !== accessory_1.AccessoryTypes.lightbulb) {
            throw new Error("The parameter accessory must be a lightbulb!");
        }
        // the url to be requested
        const url = `${gateway_1.gateway.requestBase}${endpoints_1.endpoints.devices}/${accessory.instanceId}`;
        // create a copy to modify
        const newAccessory = accessory.clone();
        // get the Light instance to modify
        const light = newAccessory.lightList[0];
        light.merge(operation);
        const serializedObj = newAccessory.serialize(accessory); // serialize with the old object as a reference
        // If the serialized object contains no properties, we don't need to send anything
        if (!serializedObj || Object.keys(serializedObj).length === 0) {
            global_1.Global.log("stateChange > empty object, not sending any payload", "debug");
            return false; // signal that no request was made
        }
        let payload = JSON.stringify(serializedObj);
        global_1.Global.log("stateChange > sending payload: " + payload, "debug");
        payload = Buffer.from(payload);
        yield node_coap_client_1.CoapClient.request(url, "put", payload);
        return true;
    });
}
exports.operateLight = operateLight;
/**
 * Sets some properties on a group
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
function operateGroup(group, operation) {
    return __awaiter(this, void 0, void 0, function* () {
        // the url to be requested
        const url = `${gateway_1.gateway.requestBase}${endpoints_1.endpoints.groups}/${group.instanceId}`;
        // create a copy to modify
        const newGroup = group.clone();
        newGroup.merge(operation);
        const serializedObj = newGroup.serialize(group); // serialize with the old object as a reference
        // If the serialized object contains no properties, we don't need to send anything
        if (!serializedObj || Object.keys(serializedObj).length === 0) {
            global_1.Global.log("stateChange > empty object, not sending any payload", "debug");
            return false; // signal that no request was made
        }
        let payload = JSON.stringify(serializedObj);
        global_1.Global.log("stateChange > sending payload: " + payload, "debug");
        payload = Buffer.from(payload);
        yield node_coap_client_1.CoapClient.request(url, "put", payload);
        return true;
    });
}
exports.operateGroup = operateGroup;
/**
 * Sets some properties on virtual group or virtual properties on a real group.
 * Can be used to manually update non-existing endpoints on real groups.
 * @param group The group to be updated
 * @param operation The properties to be set
 * @returns true if a request was sent, false otherwise
 */
function operateVirtualGroup(group, operation) {
    return __awaiter(this, void 0, void 0, function* () {
        // find all lightbulbs belonging to this group
        const lightbulbAccessories = group.deviceIDs
            .map(id => gateway_1.gateway.devices[id])
            .filter(dev => dev != null && dev.type === accessory_1.AccessoryTypes.lightbulb);
        for (const acc of lightbulbAccessories) {
            yield operateLight(acc, operation);
        }
        // and update the group
        if (group instanceof virtual_group_1.VirtualGroup) {
            group.merge(operation);
        }
    });
}
exports.operateVirtualGroup = operateVirtualGroup;
/**
 * Renames a device
 * @param accessory The device to be renamed
 * @param newName The new name to be given to the device
 * @returns true if a request was sent, false otherwise
 */
function renameDevice(accessory, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        // create a copy to modify
        const newAccessory = accessory.clone();
        newAccessory.name = newName;
        // serialize with the old object as a reference
        const serializedObj = newAccessory.serialize(accessory);
        // If the serialized object contains no properties, we don't need to send anything
        if (!serializedObj || Object.keys(serializedObj).length === 0) {
            global_1.Global.log("renameDevice > empty object, not sending any payload", "debug");
            return false;
        }
        // get the payload
        let payload = JSON.stringify(serializedObj);
        global_1.Global.log("renameDevice > sending payload: " + payload, "debug");
        payload = Buffer.from(payload);
        yield node_coap_client_1.CoapClient.request(`${gateway_1.gateway.requestBase}${endpoints_1.endpoints.devices}/${accessory.instanceId}`, "put", payload);
        return true;
    });
}
exports.renameDevice = renameDevice;
/**
 * Renames a group
 * @param group The group to be renamed
 * @param newName The new name to be given to the group
 * @returns true if a request was sent, false otherwise
 */
function renameGroup(group, newName) {
    return __awaiter(this, void 0, void 0, function* () {
        // create a copy to modify
        const newGroup = group.clone();
        newGroup.name = newName;
        // serialize with the old object as a reference
        const serializedObj = newGroup.serialize(group);
        // If the serialized object contains no properties, we don't need to send anything
        if (!serializedObj || Object.keys(serializedObj).length === 0) {
            global_1.Global.log("renameGroup > empty object, not sending any payload", "debug");
            return false;
        }
        // get the payload
        let payload = JSON.stringify(serializedObj);
        global_1.Global.log("renameDevice > sending payload: " + payload, "debug");
        payload = Buffer.from(payload);
        yield node_coap_client_1.CoapClient.request(`${gateway_1.gateway.requestBase}${endpoints_1.endpoints.groups}/${group.instanceId}`, "put", payload);
        return true;
    });
}
exports.renameGroup = renameGroup;
