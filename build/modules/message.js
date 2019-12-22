"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("alcalzone-shared/objects");
const typeguards_1 = require("alcalzone-shared/typeguards");
const node_tradfri_client_1 = require("node-tradfri-client");
const global_1 = require("../lib/global");
const iobroker_objects_1 = require("../lib/iobroker-objects");
const virtual_group_1 = require("../lib/virtual-group");
const groups_1 = require("./groups");
const session_1 = require("./session");
exports.onMessage = (obj) => __awaiter(void 0, void 0, void 0, function* () {
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
            case "request": { // custom CoAP request
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
                global_1.Global.log(`custom coap request: ${params.method.toUpperCase()} "${params.path}"`);
                // wait for the CoAP response and respond to the message
                const resp = yield session_1.session.tradfri.request(params.path, params.method, params.payload);
                respond(responses.RESULT(resp));
                return;
            }
            case "addVirtualGroup": {
                // calculate the next ID
                const nextID = Math.max(0, ...Object.keys(session_1.session.virtualGroups).map(k => +k)) + 1;
                // create the group
                const newGroup = new virtual_group_1.VirtualGroup(nextID);
                newGroup.name = `virtual group ${nextID}`;
                // create the ioBroker objects
                session_1.session.virtualGroups[nextID] = newGroup;
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
                if (!(id in session_1.session.virtualGroups)) {
                    respond({ error: `no virtual group with ID ${id} found!` });
                    return;
                }
                const group = session_1.session.virtualGroups[id];
                // Update the device ids
                if (params.deviceIDs != null && typeguards_1.isArray(params.deviceIDs)) {
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
                if (!(id in session_1.session.virtualGroups)) {
                    respond({ error: `no virtual group with ID ${id} found!` });
                    return;
                }
                const group = session_1.session.virtualGroups[id];
                const channel = iobroker_objects_1.calcGroupName(group);
                yield global_1.Global.adapter.deleteChannel(channel);
                delete session_1.session.virtualGroups[id];
                respond(responses.OK);
                return;
            }
            case "getGroups": { // get all groups defined on the gateway
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
                    for (const [id, group] of objects_1.entries(session_1.session.groups)) {
                        ret[id] = {
                            id,
                            name: group.group.name,
                            deviceIDs: group.group.deviceIDs,
                            type: "real",
                        };
                    }
                }
                if (groupType === "virtual" || groupType === "both") {
                    for (const [id, group] of objects_1.entries(session_1.session.virtualGroups)) {
                        ret[id] = {
                            id,
                            name: group.name || "Unbenannte Gruppe",
                            deviceIDs: group.deviceIDs || [],
                            type: "virtual",
                        };
                    }
                }
                respond(responses.RESULT(ret));
                return;
            }
            case "getDevices": { // get all devices defined on the gateway
                // check the given params
                const params = obj.message;
                // device type must be "lightbulb", "plug" or "all"
                const deviceType = params.type || "all";
                const allowedDeviceTypes = ["lightbulb", "plug", "blind", "all"];
                if (allowedDeviceTypes.indexOf(deviceType) === -1) {
                    respond(responses.ERROR(`device type must be one of ${allowedDeviceTypes.map(t => `"${t}"`).join(", ")}`));
                    return;
                }
                const ret = {};
                const predicate = ([, device]) => deviceType === "all"
                    ? allowedDeviceTypes.indexOf(node_tradfri_client_1.AccessoryTypes[device.type]) > -1
                    : deviceType === node_tradfri_client_1.AccessoryTypes[device.type];
                const selectedDevices = objects_1.entries(session_1.session.devices).filter(predicate);
                for (const [id, acc] of selectedDevices) {
                    ret[id] = {
                        id,
                        name: acc.name,
                        type: deviceType,
                    };
                }
                respond(responses.RESULT(ret));
                return;
            }
            case "getDevice": { // get preprocessed information about a device
                // require the id to be given
                if (!requireParams("id"))
                    return;
                // check the given params
                const params = obj.message;
                if (!(params.id in session_1.session.devices)) {
                    respond(responses.ERROR(`device with id ${params.id} not found`));
                    return;
                }
                const device = session_1.session.devices[params.id];
                // TODO: Do we need more?
                const ret = {
                    name: device.name,
                    type: node_tradfri_client_1.AccessoryTypes[device.type],
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
