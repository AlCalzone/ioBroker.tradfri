"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ipsoObject = require("./ipsoObject");

var _ipsoObject2 = _interopRequireDefault(_ipsoObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// contains information about a specific device
var DeviceInfo = function (_IPSOObject) {
	_inherits(DeviceInfo, _IPSOObject);

	function DeviceInfo(sourceObj) {
		var _ref;

		_classCallCheck(this, DeviceInfo);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = DeviceInfo.__proto__ || Object.getPrototypeOf(DeviceInfo)).call.apply(_ref, [this, sourceObj].concat(properties, [["9", "battery", 0], // <int>
		["3", "firmwareVersion", ""], // <string>
		["0", "manufacturer", ""], // <string>
		["1", "modelNumber", ""], // <string>
		["6", "power", 0], // <int>
		["2", "serialNumber", ""] // <string>
		])));
	}

	return DeviceInfo;
}(_ipsoObject2.default);

exports.default = DeviceInfo;
//# sourceMappingURL=../../maps/ipso/deviceInfo.js.map
