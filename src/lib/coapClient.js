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
export default class CoapClient {

	constructor(endpoint, callbackFn) {
		this[_endpoint] = endpoint;
		this[callback] = callbackFn;
	}

	get endpoint() { return this[_endpoint];}
	get isObserving() { return this[_isObserving]; }

	// fires off a single one-off request
	request(method = "get", payload) {
		// begin request
		const requestOptions = getRequestOptions(method, this.endpoint, false);
		_.log(`requesting coap endpoint ${requestOptions.hostname}${requestOptions.pathname}`);

		coap.request(requestOptions, getDTLSOptions(), req => {
			req.on("response", res => {
				_.log(`got a response...`);
				// no need to remember response
				// notify our creator
				if (this[callback]) this[callback](res.payload);
				// TODO: handle errors
			});
			// potentially write payload
			if (_.isdef(payload)) req.write(JSON.stringify(payload));
			// finish request
			req.end();
		});
	}

	// starts observing the resource
	observe(method = "get", payload) {
		// can only observe once!
		if (this[_isObserving]) return;

		// begin request
		const requestOptions = getRequestOptions(method, this.endpoint, true);
		_.log(`trying to observe coap endpoint ${requestOptions.hostname}${requestOptions.pathname}`);

		coap.request(requestOptions, getDTLSOptions(), req => {
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
			});
			// potentially write payload
			if (_.isdef(payload)) req.write(JSON.stringify(payload));
			// finish request
			req.end();
			this[_isObserving] = true;
		});
	}

	// stops observing the resource
	stop() {
		// can only end while observing
		if (!this[_isObserving]) return;
		try {
			_.log("closing observer socket");
			this[response].close();
			_.log("success");
		} catch (e) {/* doesn't matter if it failed */}
	}

}

// constructs the "common" part of the COAP request options
function getRequestOptions(method, endpoint, observe = true) {
	return {
		hostname: _.adapter.config.host,
		method: method,
		protocol: "coaps:",
		port: 5684,
		observe: observe,
		pathname: "/" + endpoint
	};
}

function getDTLSOptions() {
	return {
		psk: new Buffer(_.adapter.config.securityCode),
		PSKIdent: new Buffer('Client_identity'),
		key: null,
		peerPublicKey: null
	};
}