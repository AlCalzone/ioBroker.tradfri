"use strict";
//import IPSOObject from "./ipsoObject";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ipsoDevice = require("./ipsoDevice");

var _ipsoDevice2 = _interopRequireDefault(_ipsoDevice);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

//import DeviceInfo from "./deviceInfo";

// 
var Light = function (_IPSODevice) {
	_inherits(Light, _IPSODevice);

	function Light(sourceObj) {
		var _ref;

		_classCallCheck(this, Light);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = Light.__proto__ || Object.getPrototypeOf(Light)).call.apply(_ref, [this, sourceObj].concat(properties, [["5706", "color", "f1e0b5"], // hex string
		["5709", "colorX", 0], // int
		["5710", "colorY", 0], // int
		["5805", "cumulativeActivePower", 0.0], // <float>
		["5851", "dimmer", 0], // <int> [0..254]
		["5850", "onOff", false], // <bool>
		["5852", "onTime", ""], // <int>
		["5820", "powerFactor", 0.0], // <float>
		["5712", "transitionTime", 5], // <int>
		["5701", "unit", ""]])));
	}

	return Light;
}(_ipsoDevice2.default);

exports.default = Light;
//# sourceMappingURL=../maps/ipso/light.js.map
