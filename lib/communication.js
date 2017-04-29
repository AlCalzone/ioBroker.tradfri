"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.buildCommand = buildCommand;
exports.queryEndpoint = queryEndpoint;

var _child_process = require("child_process");

var _child_process2 = _interopRequireDefault(_child_process);

var _promises = require("./promises");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var execP = function execP(cmd, opt) {
	return new Promise(function (resolve, reject) {
		_child_process2.default.exec(cmd, opt, function (err, stdout, stderr) {
			if (err) return reject(stderr);
			return resolve(stdout);
		});
	});
};

// Konstruiert die Kommandozeile f�r eine Abfrage
function buildCommand(endpoint) {
	var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "get";
	var payload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

	var params = ['-u "Client_identity"', `-k "${options.key}"`];
	if (mode == "set") params.push('-m put');
	if (payload) params.push(`-e "${JSON.stringify(payload)}"`);
	return `coap-client ${params.join(" ")} "coaps://${options.host}:5684/${endpoint}" | awk 'NR==4'`;
}

// Sendet ein Kommando an einen Endpoint und parst die Antwort
function queryEndpoint(endpoint) {
	var mode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "get";
	var payload = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

	var cmd = buildCommand(endpoint, mode, payload);
	return new Promise(function (res, rej) {
		execP(cmd).then(function (data) {
			var result = JSON.parse(data);
			res(result);
		}).catch(function (err) {
			rej(err);
		});
	});
}
//# sourceMappingURL=../../maps/lib/communication.js.map
