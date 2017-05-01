"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

// use mutex to run requests in sequence


var _global = require("./global");

var _global2 = _interopRequireDefault(_global);

var _coapDtls = require("coap-dtls");

var _coapDtls2 = _interopRequireDefault(_coapDtls);

var _promises = require("./promises");

var _deferPromise = require("./defer-promise");

var _deferPromise2 = _interopRequireDefault(_deferPromise);

var _mutex = require("./mutex");

var _mutex2 = _interopRequireDefault(_mutex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var socketLock = new _mutex2.default();

var
//request = Symbol("request"),
_endpoint = Symbol("_endpoint"),
    _userObj = Symbol("_userObj"),
    response = Symbol("response"),
    callback = Symbol("callback"),
    _isObserving = Symbol("_isObserving");
var __request = Symbol("__request"),
    __observe = Symbol("__observe");

// observes a resource via COAP and notifies listeners of new data

var CoapClient = function () {
	function CoapClient(endpoint, callbackFn, userObj) {
		_classCallCheck(this, CoapClient);

		this[_endpoint] = endpoint;
		this[callback] = callbackFn;
		this[_userObj] = userObj;
	}

	_createClass(CoapClient, [{
		key: "request",
		value: function request() {
			var _this = this;

			var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "get";
			var payload = arguments[1];

			// make sure the requests will be done in sequence
			return socketLock.synchronize(function () {
				return _this[__request](method, payload);
			});
		}
		// fires off a single one-off request
		// the returned promise has to be fulfilled before another request can be done

	}, {
		key: __request,
		value: function value() {
			var _this2 = this;

			var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "get";
			var payload = arguments[1];


			// begin request
			var reqOpts = getRequestOptions(method, this.endpoint, false);
			_global2.default.log(`requesting coap endpoint ${reqOpts.hostname}${reqOpts.pathname}`);

			var dtlsOpts = getDTLSOptions();

			// create deferred promise. acts as return value for flow control
			var ret = (0, _deferPromise2.default)();

			_coapDtls2.default.request(reqOpts, dtlsOpts, function (req) {
				req.on("response", function (res) {
					var body = parsePayload(res.payload);
					////_.log(`got a response... ${JSON.stringify(body)}`);
					// no need to remember response

					// resume program flow
					ret.resolve();

					// notify our creator
					if (_this2[callback]) _this2[callback](body, _this2[_userObj], { reason: "initial" });
					// TODO: handle errors
				});
				// potentially write payload
				if (_global2.default.isdef(payload)) req.write(JSON.stringify(payload));
				// finish request
				req.end();
			});

			return ret;
		}
	}, {
		key: "observe",
		value: function observe() {
			var _this3 = this;

			var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "get";
			var payload = arguments[1];

			// make sure the requests will be done in sequence
			return socketLock.synchronize(function () {
				return _this3[__observe](method, payload);
			});
		}
		// starts observing the resource

	}, {
		key: __observe,
		value: function value() {
			var _this4 = this;

			var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "get";
			var payload = arguments[1];

			// can only observe once!
			if (this[_isObserving]) return;

			// begin request
			var reqOpts = getRequestOptions(method, this.endpoint, false);
			_global2.default.log(`requesting coap endpoint ${reqOpts.hostname}${reqOpts.pathname}`);

			var dtlsOpts = getDTLSOptions();

			// create deferred promise. acts as return value for flow control
			var ret = (0, _deferPromise2.default)();

			_coapDtls2.default.request(reqOpts, dtlsOpts, function (req) {
				req.on("response", function (res) {
					var body = parsePayload(res.payload);
					////_.log(`got a response... ${JSON.stringify(body)}`);
					// we got a response, remember it
					_this4[response] = res;
					res.on("data", function (data) {
						var body = parsePayload(data);

						// resume program flow
						ret.resolve();

						////_.log(`got additional data... ${JSON.stringify(body)}`);
						// we got additional data, notify our creator
						if (_this4[callback]) _this4[callback](body, _this4[_userObj], { reason: "update" });
					});
					// also notify our creator
					if (_this4[callback]) _this4[callback](body, _this4[_userObj], { reason: "initial" });
					// TODO: handle errors
				});
				// potentially write payload
				if (_global2.default.isdef(payload)) req.write(JSON.stringify(payload));
				// finish request
				req.end();
				_this4[_isObserving] = true;
			});

			return ret;
		}

		// stops observing the resource

	}, {
		key: "stop",
		value: function stop() {
			// can only end while observing
			if (!this[_isObserving]) return;
			try {
				_global2.default.log("closing observer socket");
				this[response].close();
				_global2.default.log("success");
			} catch (e) {/* doesn't matter if it failed */}
		}
	}, {
		key: "endpoint",
		get: function get() {
			return this[_endpoint];
		}
	}, {
		key: "isObserving",
		get: function get() {
			return this[_isObserving];
		}
	}]);

	return CoapClient;
}();

exports.default = CoapClient;


function parsePayload(payload) {
	if (payload instanceof Buffer) {
		payload = payload.toString("utf-8");
	} else if (typeof payload === "string") {
		// payload = payload;
	} else {
		throw `unsupported payload type "${typeof payload}"`;
	}
	return JSON.parse(payload);
}

// constructs the "common" part of the COAP request options
function getRequestOptions(method, endpoint) {
	var observe = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

	return {
		hostname: _global2.default.adapter.config.host,
		method: method,
		protocol: "coaps:",
		port: 5684,
		observe: observe,
		pathname: "/" + endpoint
	};
}

function getDTLSOptions() {
	return {
		psk: new Buffer(_global2.default.adapter.config.securityCode),
		PSKIdent: new Buffer('Client_identity'),
		key: null,
		peerPublicKey: null
	};
}
//# sourceMappingURL=../maps/lib/coapClient.js.map
