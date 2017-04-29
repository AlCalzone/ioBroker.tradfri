"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ipsoObject = require("./ipsoObject");

var _ipsoObject2 = _interopRequireDefault(_ipsoObject);

var _ipsoDevice = require("./ipsoDevice");

var _ipsoDevice2 = _interopRequireDefault(_ipsoDevice);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// contains information about the gateway
var GatewayDetails = function (_IPSODevice) {
	_inherits(GatewayDetails, _IPSODevice);

	function GatewayDetails(sourceObj) {
		var _ref;

		_classCallCheck(this, GatewayDetails);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = GatewayDetails.__proto__ || Object.getPrototypeOf(GatewayDetails)).call.apply(_ref, [this, sourceObj].concat(properties, [["9023", "ntpServerUrl", ""], ["9029", "version", ""], ["9054", "updateState", 0], // <int> => which enum?
		["9055", "updateProgress", 100], // <int>
		["9056", "updateDetailsURL", ""], // <string> => what is this?
		["9059", "currentTimestamp", 0], // <long>
		["9060", "UNKNOWN1", ""], // <string> => something to do with commissioning? XML-Date
		["9061", "commissioningMode", 0], // <int> => which enum?
		["9062", "UNKNOWN2", 0], // <int> => something more with commissioning?
		["9066", "updatePriority", 0], // <updatePriority>
		["9069", "updateAcceptedTimestamp", 0], // <int>
		["9071", "timeSource", -1], // <int>
		["9072", "UNKNOWN3", 0], // <int/bool> => what is this?
		["9073", "UNKNOWN4", 0], // <int/bool> => what is this?
		["9074", "UNKNOWN5", 0], // <int/bool> => what is this?
		["9075", "UNKNOWN6", 0], // <int/bool> => what is this?
		["9076", "UNKNOWN7", 0], // <int/bool> => what is this?
		["9077", "UNKNOWN8", 0], // <int/bool> => what is this?
		["9078", "UNKNOWN9", 0], // <int/bool> => what is this?
		["9079", "UNKNOWN10", 0], // <int/bool> => what is this?
		["9080", "UNKNOWN11", 0], // <int/bool> => what is this?
		["9081", "UNKNOWN12", ""], // some kind of hex code
		// are those used?
		["9032", "FORCE_CHECK_OTA_UPDATE", ""], ["9035", "name", ""]])));
	}

	return GatewayDetails;
}(_ipsoDevice2.default);

exports.default = GatewayDetails;
//# sourceMappingURL=../maps/ipso/gatewayDetails.js.map
