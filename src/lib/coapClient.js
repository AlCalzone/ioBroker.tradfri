"use strict";

import _ from "./global";
import {CoapClient as coap} from "node-coap-client";
//import { promisify } from "./promises";
import deferred from "./defer-promise";

// use mutex to run requests in sequence
import Mutex from "./mutex";
const socketLock = new Mutex();

const
	//request = Symbol("request"),
	_endpoint = Symbol("_endpoint"),
	_userObj = Symbol("_userObj"),
	response = Symbol("response"),
	callback = Symbol("callback"),
	_isObserving = Symbol("_isObserving")
	;
const
	__request = Symbol("__request"),
	__observe = Symbol("__observe")
	;

// observes a resource via COAP and notifies listeners of new data
export default class CoapClient {

	constructor(endpoint, callbackFn, userObj) {
		this[_endpoint] = endpoint;
		this[callback] = callbackFn;
		this[_userObj] = userObj;

		coap.setSecurityParams()
	}

	get endpoint() { return this[_endpoint];}
	get isObserving() { return this[_isObserving]; }

	request(method = "get", payload) {
		// make sure the requests will be done in sequence
		return socketLock.synchronize(
			() => this[__request](method, payload)
		);
	}
	// fires off a single one-off request
	// the returned promise has to be fulfilled before another request can be done
	[__request](method = "get", payload) {

		// begin request
		const reqOpts = getRequestOptions(method, this.endpoint, false);
		_.log(`requesting coap endpoint ${reqOpts.hostname}${reqOpts.pathname}`);

		const dtlsOpts = getDTLSOptions();

		// create deferred promise. acts as return value for flow control
		const ret = deferred();

		coap.request(reqOpts, dtlsOpts, req => {
			req.on("response", res => {
				const body = parsePayload(res.payload);
				////_.log(`got a response... ${JSON.stringify(body)}`);
				// no need to remember response

				// resume program flow
				ret.resolve();

				// notify our creator
				if (this[callback]) this[callback](body, this[_userObj], { reason: "initial" });
				// TODO: handle errors
			});
			// potentially write payload
			if (_.isdef(payload)) req.write(JSON.stringify(payload));
			// finish request
			req.end();
		});

		return ret;
	}

	observe(method = "get", payload) {
		// make sure the requests will be done in sequence
		return socketLock.synchronize(
			() => this[__observe](method, payload)
		);
	}
	// starts observing the resource
	[__observe](method = "get", payload) {
		// can only observe once!
		if (this[_isObserving]) return;

		// begin request
		const reqOpts = getRequestOptions(method, this.endpoint, true);
		_.log(`requesting coap endpoint ${reqOpts.hostname}${reqOpts.pathname}`);

		const dtlsOpts = getDTLSOptions();

		// create deferred promise. acts as return value for flow control
		const ret = deferred();

		coap.request(reqOpts, dtlsOpts, req => {
			req.on("response", res => {
				const body = parsePayload(res.payload);
				////_.log(`got a response... ${JSON.stringify(body)}`);
				// we got a response, remember it
				this[response] = res;
				res.on("data", data => {
					const body = parsePayload(data);
					////_.log(`got additional data... ${JSON.stringify(body)}`);
					// we got additional data, notify our creator
					if (this[callback]) this[callback](body, this[_userObj], { reason: "update" });
				});

				// resume program flow
				ret.resolve();

				// also notify our creator
				if (this[callback]) this[callback](body, this[_userObj], { reason: "initial" });
				// TODO: handle errors
			});
			// potentially write payload
			if (_.isdef(payload)) req.write(JSON.stringify(payload));
			// finish request
			req.end();
			this[_isObserving] = true;
		});

		return ret;
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

function parsePayload(payload) {
	if (payload instanceof Buffer) {
		payload = payload.toString("utf-8");
	} else if (typeof payload === "string") {
		// payload = payload;
	} else {
		throw `unsupported payload type "${typeof payload}"`;
	}
	if (payload == undefined || payload == "") return {};
	return JSON.parse(payload);
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