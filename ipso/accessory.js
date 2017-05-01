"use strict";
//import IPSOObject from "./ipsoObject";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ipsoDevice = require("./ipsoDevice");

var _ipsoDevice2 = _interopRequireDefault(_ipsoDevice);

var _deviceInfo = require("./deviceInfo");

var _deviceInfo2 = _interopRequireDefault(_deviceInfo);

var _light = require("./light");

var _light2 = _interopRequireDefault(_light);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// 
var Accessory = function (_IPSODevice) {
	_inherits(Accessory, _IPSODevice);

	function Accessory(sourceObj) {
		var _ref;

		_classCallCheck(this, Accessory);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = Accessory.__proto__ || Object.getPrototypeOf(Accessory)).call.apply(_ref, [this, sourceObj].concat(properties, [["5750", "type", 0], // <AccessoryType>
		["3", "deviceInfo", null, function (obj) {
			return new _deviceInfo2.default(obj);
		}], // <DeviceInfo>
		["9019", "alive", false], // <boolean>
		["9020", "lastSeen", 0], // <long>
		["3311", "lightList", [], function (obj) {
			return new _light2.default(obj);
		}], // <[Light]>
		["3312", "plugList", [], function (obj) {
			return new _ipsoDevice2.default(obj);
		}], // <[Plug]> // seems unsupported atm.
		["3300", "sensorList", [], function (obj) {
			return new _ipsoDevice2.default(obj);
		}], // <[Sensor]> // seems unsupported atm.
		["15009", "switchList", [], function (obj) {
			return new _ipsoDevice2.default(obj);
		}], // <[Switch]> // seems unsupported atm.
		["9054", "otaUpdateState", 0]])));
	}

	return Accessory;
}(_ipsoDevice2.default);

exports.default = Accessory;
//# sourceMappingURL=../maps/ipso/accessory.js.map
