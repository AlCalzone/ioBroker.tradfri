"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _global = require("./global");

var _global2 = _interopRequireDefault(_global);

var _coapDtls = require("coap-dtls");

var _coapDtls2 = _interopRequireDefault(_coapDtls);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var
//request = Symbol("request"),
_endpoint = Symbol("_endpoint"),
    response = Symbol("response"),
    callback = Symbol("callback"),
    _isObserving = Symbol("_isObserving");

// observes a resource via COAP and notifies listeners of new data

var CoapResourceObserver = function () {
	function CoapResourceObserver(endpoint, callbackFn) {
		_classCallCheck(this, CoapResourceObserver);

		this[_endpoint] = endpoint;
		this[callback] = callbackFn;
	}

	_createClass(CoapResourceObserver, [{
		key: "start",
		value: function start() {
			var _this = this;

			var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "get";
			var payload = arguments[1];

			// can only observe once!
			if (this[_isObserving]) return;

			// Request consists of 2 options objects,
			// the common one:
			var requestOptions = {
				hostname: _global2.default.adapter.config.host,
				method: method,
				protocol: "coaps:",
				port: 5684,
				observe: true,
				pathname: "/" + this.endpoint
			};
			// and the DTLS one:
			var dtlsOptions = {
				psk: new Buffer(_global2.default.adapter.config.securityCode),
				PSKIdent: new Buffer('Client_identity'),
				key: null,
				peerPublicKey: null
			};

			_global2.default.log(`trying to observe coap endpoint ${requestOptions.hostname}/${this.endpoint}`);

			// begin request
			_coapDtls2.default.request(requestOptions, dtlsOptions, function (req) {
				req.on("response", function (res) {
					_global2.default.log(`got a response...`);
					// we got a response, remember it
					_this[response] = res;
					res.on("data", function (data) {
						_global2.default.log(`got aadditional data...`);
						// we got additional data, notify our creator
						if (_this[callback]) _this[callback](data);
					});
					// also notify our creator
					if (_this[callback]) _this[callback](res.payload);
					// TODO: handle errors
				});
				// potentially write payload
				if (_global2.default.isdef(payload)) req.write(JSON.stringify(payload));
				// finish request
				req.end();
				_this[_isObserving] = true;
			});
		}

		// stops observing the resource

	}, {
		key: "end",
		value: function end() {
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

	return CoapResourceObserver;
}();

exports.default = CoapResourceObserver;
//# sourceMappingURL=../maps/lib/coapResourceObserver.js.map
