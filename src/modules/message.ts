import { CoapClient as coap } from "node-coap-client";
import { AccessoryTypes } from "../ipso/accessory";
import { parsePayload } from "../lib/coap-payload";
import { Global as _ } from "../lib/global";
import { DictionaryLike, entries } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";
import { Device as SendToDevice, Group as SendToGroup } from "./communication";
import { gateway as gw } from "./gateway";
import { calcGroupName, extendVirtualGroup, updateGroupStates } from "./groups";

export async function onMessage(obj) {
	// responds to the adapter that sent the original message
	function respond(response) {
		if (obj.callback) _.adapter.sendTo(obj.from, obj.command, response, obj.callback);
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
		ERROR: (error: string) => ({ error }),
	};
	// make required parameters easier
	function requireParams(...params: string[]) {
		if (!(params && params.length)) return true;
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
			case "request": {// custom CoAP request
				// require the path to be given
				if (!requireParams("path")) return;

				// check the given params
				const params = obj.message as any;
				params.method = params.method || "get";
				if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
					respond({ error: `unsupported request method "${params.method}"` });
					return;
				}

				_.log(`custom coap request: ${params.method.toUpperCase()} "${gw.requestBase}${params.path}"`);

				// create payload
				let payload: string | Buffer;
				if (params.payload) {
					payload = JSON.stringify(params.payload);
					_.log("sending custom payload: " + payload);
					payload = Buffer.from(payload);
				}

				// wait for the CoAP response and respond to the message
				const resp = await coap.request(`${gw.requestBase}${params.path}`, params.method, payload as Buffer);
				respond(responses.RESULT({
					code: resp.code.toString(),
					payload: parsePayload(resp),
				}));
				return;
			}

			case "addVirtualGroup": {
				// calculate the next ID
				const nextID = Math.max(0, ...Object.keys(gw.virtualGroups).map(k => +k)) + 1;
				// create the group
				const newGroup = new VirtualGroup(nextID);
				newGroup.name = `virtual group ${nextID}`;
				// create the ioBroker objects
				gw.virtualGroups[nextID] = newGroup;
				extendVirtualGroup(newGroup);
				// and return the id
				respond(responses.RESULT(nextID));

				return;
			}

			case "editVirtualGroup": {
				// require the id to be given
				if (!requireParams("id")) return;

				// check the given params
				const params = obj.message as any;
				const id = parseInt(params.id, 10);

				if (!(id in gw.virtualGroups)) {
					respond({ error: `no virtual group with ID ${id} found!` });
					return;
				}

				const group = gw.virtualGroups[id];
				// Update the device ids
				if (params.deviceIDs != null && params.deviceIDs instanceof Array) {
					group.deviceIDs = params.deviceIDs.map(d => parseInt(d, 10)).filter(d => !isNaN(d));
				}
				// Change the name
				if (typeof params.name === "string" && params.name.length > 0) {
					group.name = params.name;
				}
				// save the changes
				extendVirtualGroup(group);
				updateGroupStates(group);

				respond(responses.OK);
				return;
			}

			case "deleteVirtualGroup": {
				// require the id to be given
				if (!requireParams("id")) return;

				// check the given params
				const params = obj.message as any;
				const id = parseInt(params.id, 10);

				if (!(id in gw.virtualGroups)) {
					respond({ error: `no virtual group with ID ${id} found!` });
					return;
				}

				const group = gw.virtualGroups[id];
				const channel = calcGroupName(group);
				await _.adapter.deleteChannel(channel);
				delete gw.virtualGroups[id];

				respond(responses.OK);
				return;
			}

			case "getGroups": { // get all groups defined on the gateway
				// check the given params
				const params = obj.message as any;
				// group type must be "real", "virtual" or "both"
				const groupType = params.type || "real";
				if (["real", "virtual", "both"].indexOf(groupType) === -1) {
					respond(responses.ERROR(`group type must be "real", "virtual" or "both"`));
					return;
				}

				const ret: DictionaryLike<SendToGroup> = {};
				if (groupType === "real" || groupType === "both") {
					for (const [id, group] of entries(gw.groups)) {
						ret[id] = {
							id,
							name: group.group.name,
							deviceIDs: group.group.deviceIDs,
							type: "real",
						};
					}
				}
				if (groupType === "virtual" || groupType === "both") {
					for (const [id, group] of entries(gw.virtualGroups)) {
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

			case "getDevices": { // get all devices defined on the gateway
				// check the given params
				const params = obj.message as any;
				// group type must be "real", "virtual" or "both"
				const deviceType = params.type || "lightbulb";
				if (["lightbulb"].indexOf(deviceType) === -1) {
					respond(responses.ERROR(`device type must be "lightbulb"`));
					return;
				}

				const ret: DictionaryLike<SendToDevice> = {};
				if (deviceType === "lightbulb") {
					const lightbulbs = entries(gw.devices).filter(([id, device]) => device.type === AccessoryTypes.lightbulb);
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

			case "getDevice": { // get preprocessed information about a device
				// require the id to be given
				if (!requireParams("id")) return;

				// check the given params
				const params = obj.message as any;
				if (!(params.id in gw.devices)) {
					respond(responses.ERROR(`device with id ${params.id} not found`));
					return;
				}

				const device = gw.devices[params.id];
				// TODO: Do we need more?
				const ret = {
					name: device.name,
					type: AccessoryTypes[device.type], // type as string
				} as any;
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
}
