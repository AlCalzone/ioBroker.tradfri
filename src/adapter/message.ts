import { CoapClient as coap, CoapResponse } from "node-coap-client";
import { Accessory, AccessoryTypes } from "../ipso/accessory";
import { parsePayload } from "../lib/coap-payload";
import { ExtendedAdapter, Global as _ } from "../lib/global";
import { entries } from "../lib/object-polyfill";
import { gateway as gw } from "./gateway";

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

			case "getGroups": { // get all groups defined on the gateway
				// check the given params
				const params = obj.message as any;
				// group type must be "real", "virtual" or "both"
				const groupType = params.type || "real";
				if (["real", "virtual", "both"].indexOf(groupType) === -1) {
					respond(responses.ERROR(`group type must be "real", "virtual" or "both"`));
					return;
				}

				const ret = {};
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
