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

// common base class for all devices
var IPSODevice = function (_IPSOObject) {
	_inherits(IPSODevice, _IPSOObject);

	function IPSODevice(sourceObj) {
		var _ref;

		_classCallCheck(this, IPSODevice);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = IPSODevice.__proto__ || Object.getPrototypeOf(IPSODevice)).call.apply(_ref, [this, sourceObj].concat(properties, [["9001", "name", ""], ["9002", "createdAt", 0], // <long>
		["9003", "instanceId", ""] // <int>
		])));
	}

	return IPSODevice;
}(_ipsoObject2.default);

exports.default = IPSODevice;
//# sourceMappingURL=../maps/ipso/ipsoDevice.js.map
