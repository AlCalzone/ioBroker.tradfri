"use strict";
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
const coap_payload_1 = require("../lib/coap-payload");
const global_1 = require("../lib/global");
const object_polyfill_1 = require("../lib/object-polyfill");
const virtual_group_1 = require("../lib/virtual-group");
const gateway_1 = require("./gateway");
const groups_1 = require("./groups");
function onMessage(obj) {
    return __awaiter(this, void 0, void 0, function* () {
        // responds to the adapter that sent the original message
        function respond(response) {
            if (obj.callback)
                global_1.Global.adapter.sendTo(obj.from, obj.command, response, obj.callback);
        }
        // some predefined responses so we only have to define them once
        const responses = {
            ACK: { error: null },
            OK: { error: null, result: "ok" },
            ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
            MISSING_PARAMETER: (paramName) => {
                return { error: 'missing parameter "' + paramName + '"!' };
            },
            COMMAND_RUNNING: { error: "command running" },
            RESULT: (result) => ({ error: null, result }),
            ERROR: (error) => ({ error }),
        };
        // make required parameters easier
        function requireParams(...params) {
            if (!(params && params.length))
                return true;
            for (const param of params) {
                if (!(obj.message && obj.message.hasOwnProperty(param))) {
                    respond(responses.MISSING_PARAMETER(param));
                    return false;
                }
            }
            return true;
        }
        // handle the message
        if (obj) {
            switch (obj.command) {
                case "request": {
                    // require the path to be given
                    if (!requireParams("path"))
                        return;
                    // check the given params
                    const params = obj.message;
                    params.method = params.method || "get";
                    if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
                        respond({ error: `unsupported request method "${params.method}"` });
                        return;
                    }
                    global_1.Global.log(`custom coap request: ${params.method.toUpperCase()} "${gateway_1.gateway.requestBase}${params.path}"`);
                    // create payload
                    let payload;
                    if (params.payload) {
                        payload = JSON.stringify(params.payload);
                        global_1.Global.log("sending custom payload: " + payload);
                        payload = Buffer.from(payload);
                    }
                    // wait for the CoAP response and respond to the message
                    const resp = yield node_coap_client_1.CoapClient.request(`${gateway_1.gateway.requestBase}${params.path}`, params.method, payload);
                    respond(responses.RESULT({
                        code: resp.code.toString(),
                        payload: coap_payload_1.parsePayload(resp),
                    }));
                    return;
                }
                case "addVirtualGroup": {
                    // calculate the next ID
                    const nextID = Math.max(0, ...Object.keys(gateway_1.gateway.virtualGroups).map(k => +k)) + 1;
                    // create the group
                    const newGroup = new virtual_group_1.VirtualGroup(nextID);
                    newGroup.name = `virtual group ${nextID}`;
                    // create the ioBroker objects
                    gateway_1.gateway.virtualGroups[nextID] = newGroup;
                    groups_1.extendVirtualGroup(newGroup);
                    // and return the id
                    respond(responses.RESULT(nextID));
                    return;
                }
                case "editVirtualGroup": {
                    // require the id to be given
                    if (!requireParams("id"))
                        return;
                    // check the given params
                    const params = obj.message;
                    const id = parseInt(params.id, 10);
                    if (!(id in gateway_1.gateway.virtualGroups)) {
                        respond({ error: `no virtual group with ID ${id} found!` });
                        return;
                    }
                    const group = gateway_1.gateway.virtualGroups[id];
                    // Update the device ids
                    if (params.deviceIDs != null && params.deviceIDs instanceof Array) {
                        group.deviceIDs = params.deviceIDs.map(d => parseInt(d, 10)).filter(d => !isNaN(d));
                    }
                    // Change the name
                    if (typeof params.name === "string" && params.name.length > 0) {
                        group.name = params.name;
                    }
                    // save the changes
                    groups_1.extendVirtualGroup(group);
                    groups_1.updateGroupStates(group);
                    respond(responses.OK);
                    return;
                }
                case "deleteVirtualGroup": {
                    // require the id to be given
                    if (!requireParams("id"))
                        return;
                    // check the given params
                    const params = obj.message;
                    const id = parseInt(params.id, 10);
                    if (!(id in gateway_1.gateway.virtualGroups)) {
                        respond({ error: `no virtual group with ID ${id} found!` });
                        return;
                    }
                    const group = gateway_1.gateway.virtualGroups[id];
                    const channel = groups_1.calcGroupName(group);
                    yield global_1.Global.adapter.deleteChannel(channel);
                    delete gateway_1.gateway.virtualGroups[id];
                    respond(responses.OK);
                    return;
                }
                case "getGroups": {
                    // check the given params
                    const params = obj.message;
                    // group type must be "real", "virtual" or "both"
                    const groupType = params.type || "real";
                    if (["real", "virtual", "both"].indexOf(groupType) === -1) {
                        respond(responses.ERROR(`group type must be "real", "virtual" or "both"`));
                        return;
                    }
                    const ret = {};
                    if (groupType === "real" || groupType === "both") {
                        for (const [id, group] of object_polyfill_1.entries(gateway_1.gateway.groups)) {
                            ret[id] = {
                                id,
                                name: group.group.name,
                                deviceIDs: group.group.deviceIDs,
                                type: "real",
                            };
                        }
                    }
                    if (groupType === "virtual" || groupType === "both") {
                        for (const [id, group] of object_polyfill_1.entries(gateway_1.gateway.virtualGroups)) {
                            ret[id] = {
                                id,
                                name: group.name,
                                deviceIDs: group.deviceIDs,
                                type: "virtual",
                            };
                        }
                    }
                    respond(responses.RESULT(ret));
                    return;
                }
                case "getDevices": {
                    // check the given params
                    const params = obj.message;
                    // group type must be "real", "virtual" or "both"
                    const deviceType = params.type || "lightbulb";
                    if (["lightbulb"].indexOf(deviceType) === -1) {
                        respond(responses.ERROR(`device type must be "lightbulb"`));
                        return;
                    }
                    const ret = {};
                    if (deviceType === "lightbulb") {
                        const lightbulbs = object_polyfill_1.entries(gateway_1.gateway.devices).filter(([id, device]) => device.type === accessory_1.AccessoryTypes.lightbulb);
                        for (const [id, bulb] of lightbulbs) {
                            ret[id] = {
                                id,
                                name: bulb.name,
                                type: deviceType,
                            };
                        }
                    }
                    respond(responses.RESULT(ret));
                    return;
                }
                case "getDevice": {
                    // require the id to be given
                    if (!requireParams("id"))
                        return;
                    // check the given params
                    const params = obj.message;
                    if (!(params.id in gateway_1.gateway.devices)) {
                        respond(responses.ERROR(`device with id ${params.id} not found`));
                        return;
                    }
                    const device = gateway_1.gateway.devices[params.id];
                    // TODO: Do we need more?
                    const ret = {
                        name: device.name,
                        type: accessory_1.AccessoryTypes[device.type],
                    };
                    if (ret.type === "lightbulb") {
                        ret.spectrum = device.lightList[0].spectrum;
                    }
                    respond(responses.RESULT(ret));
                    return;
                }
                default:
                    respond(responses.ERROR_UNKNOWN_COMMAND);
                    return;
            }
        }
    });
}
exports.onMessage = onMessage;
