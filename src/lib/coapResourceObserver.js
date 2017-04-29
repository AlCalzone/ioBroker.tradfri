"use strict";

import _ from "./global";
import coap from "coap-dtls";

const
	//request = Symbol("request"),
	_endpoint = Symbol("_endpoint"),
	response = Symbol("response"),
	callback = Symbol("callback"),
	_isObserving = Symbol("_isObserving")
	;

// observes a resource via COAP and notifies listeners of new data
export default class CoapResourceObserver {

	constructor(endpoint, callbackFn) {
		this[_endpoint] = endpoint;
		this[callback] = callbackFn;
	}

	get endpoint() { return this[_endpoint];}
	get isObserving() { return this[_isObserving]; }

	start(method = "get", payload) {
		// can only observe once!
		if (this[_isObserving]) return;

		// Request consists of 2 options objects,
		// the common one:
		const requestOptions = {
			hostname: _.adapter.config.host,
			method: method,
			protocol: "coaps:",
			port: 5684,
			observe: true,
			pathname: "/" + this.endpoint
		};
		// and the DTLS one:
		const dtlsOptions = {
			psk: new Buffer(_.adapter.config.securityCode),
			PSKIdent: new Buffer('Client_identity'),
			key: null,
			peerPublicKey: null
		}

		_.log(`trying to observe coap endpoint ${requestOptions.hostname}/${this.endpoint}`);

		// begin request
		coap.request(requestOptions, dtlsOptions, req => {
			req.on("response", res => {
				_.log(`got a response...`);
				// we got a response, remember it
				this[response] = res;
				res.on("data", data => {
					_.log(`got aadditional data...`);
					// we got additional data, notify our creator
					if (this[callback]) this[callback](data);
				});
				// also notify our creator
				if (this[callback]) this[callback](res.payload);
				// TODO: handle errors
			})
			// potentially write payload
			if (_.isdef(payload)) req.write(JSON.stringify(payload));
			// finish request
			req.end();
			this[_isObserving] = true;
		});
	}

	// stops observing the resource
	end() {
		// can only end while observing
		if (!this[_isObserving]) return;
		try {
			_.log("closing observer socket");
			this[response].close();
			_.log("success");
		} catch (e) {/* doesn't matter if it failed */}
	}

}