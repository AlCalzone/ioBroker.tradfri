import { CoapResponse } from "node-coap-client";
import { Global as _ } from "./global";

export function parsePayload(response: CoapResponse): any {
	switch (response.format) {
		case 0: // text/plain
		case null: // assume text/plain
			return response.payload.toString("utf-8");
		case 50: // application/json
			const json = response.payload.toString("utf-8");
			return JSON.parse(json);
		default:
			// dunno how to parse this
			_.log(`unknown CoAP response format ${response.format}`, "warn");
			return response.payload;
	}
}
