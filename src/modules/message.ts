import { entries } from "alcalzone-shared/objects";
import { isArray } from "alcalzone-shared/typeguards";
import { Accessory, AccessoryTypes } from "node-tradfri-client";
import { Global as _ } from "../lib/global";
import { calcGroupName } from "../lib/iobroker-objects";
import { VirtualGroup } from "../lib/virtual-group";
import { Device as SendToDevice, Group as SendToGroup } from "./communication";
import { extendVirtualGroup, updateGroupStates } from "./groups";
import { session as $ } from "./session";

export const onMessage: ioBroker.MessageHandler = async (obj) => {
	// responds to the adapter that sent the original message
	function respond(response: string | {}) {
		if (obj.callback) _.adapter.sendTo(obj.from, obj.command, response, obj.callback);
	}
	// some predefined responses so we only have to define them once
	const responses = {
		ACK: { error: null },
		OK: { error: null, result: "ok" },
		ERROR_UNKNOWN_COMMAND: { error: "Unknown command!" },
		MISSING_PARAMETER: (paramName: string) => {
			return { error: 'missing parameter "' + paramName + '"!' };
		},
		COMMAND_RUNNING: { error: "command running" },
		RESULT: (result: unknown) => ({ error: null, result }),
		ERROR: (error: string) => ({ error }),
	};
	// make required parameters easier
	function requireParams(...params: string[]): boolean {
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
				if (!requireParams("path")) return;

				// check the given params
				const params = obj.message as any;
				params.method = params.method || "get";
				if (["get", "post", "put", "delete"].indexOf(params.method) === -1) {
					respond({ error: `unsupported request method "${params.method}"` });
					return;
				}

				_.log(`custom coap request: ${params.method.toUpperCase()} "${params.path}"`);

				// wait for the CoAP response and respond to the message
				const resp = await $.tradfri.request(
					params.path,
					params.method,
					params.payload,
				);
				respond(responses.RESULT(resp));
				return;
			}

			case "addVirtualGroup": {
				// calculate the next ID
				const nextID = Math.max(0, ...Object.keys($.virtualGroups).map(k => +k)) + 1;
				// create the group
				const newGroup = new VirtualGroup(nextID);
				newGroup.name = `virtual group ${nextID}`;
				// create the ioBroker objects
				$.virtualGroups[nextID] = newGroup;
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

				if (!(id in $.virtualGroups)) {
					respond({ error: `no virtual group with ID ${id} found!` });
					return;
				}

				const group = $.virtualGroups[id];
				// Update the device ids
				if (params.deviceIDs != null && isArray(params.deviceIDs)) {
					group.deviceIDs = (params.deviceIDs as string[]).map(d => parseInt(d, 10)).filter(d => !isNaN(d));
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

				if (!(id in $.virtualGroups)) {
					respond({ error: `no virtual group with ID ${id} found!` });
					return;
				}

				const group = $.virtualGroups[id];
				const channel = calcGroupName(group);
				await _.adapter.deleteChannel(channel);
				delete $.virtualGroups[id];

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

				const ret: Record<string, SendToGroup> = {};
				if (groupType === "real" || groupType === "both") {
					for (const [id, group] of entries($.groups)) {
						ret[id] = {
							id,
							name: group.group.name,
							deviceIDs: group.group.deviceIDs,
							type: "real",
						};
					}
				}
				if (groupType === "virtual" || groupType === "both") {
					for (const [id, group] of entries($.virtualGroups)) {
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
				const params = obj.message as any;
				// device type must be "lightbulb", "plug" or "all"
				const deviceType = params.type || "all";
				const allowedDeviceTypes = ["lightbulb", "plug", "blind", "all"];
				if (allowedDeviceTypes.indexOf(deviceType) === -1) {
					respond(responses.ERROR(`device type must be one of ${allowedDeviceTypes.map(t => `"${t}"`).join(", ")}`));
					return;
				}

				const ret: Record<string, SendToDevice> = {};
				const predicate = ([, device]: [unknown, Accessory]) =>
					deviceType === "all"
						? allowedDeviceTypes.indexOf(AccessoryTypes[device.type]) > -1
						: deviceType === AccessoryTypes[device.type];

				const selectedDevices = entries($.devices).filter(predicate);
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
				if (!requireParams("id")) return;

				// check the given params
				const params = obj.message as any;
				if (!(params.id in $.devices)) {
					respond(responses.ERROR(`device with id ${params.id} not found`));
					return;
				}

				const device = $.devices[params.id];
				// TODO: Do we need more?
				const ret: SendToDevice = {
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
};
