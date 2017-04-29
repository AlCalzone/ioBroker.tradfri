"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ipsoObject = require("./ipsoObject");

var _ipsoObject2 = _interopRequireDefault(_ipsoObject);

var _ipsoDevice = require("./ipsoDevice");

var _ipsoDevice2 = _interopRequireDefault(_ipsoDevice);

var _deviceInfo = require("./deviceInfo");

var _deviceInfo2 = _interopRequireDefault(_deviceInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// 
var Scene = function (_IPSODevice) {
	_inherits(Scene, _IPSODevice);

	function Scene(sourceObj) {
		var _ref;

		_classCallCheck(this, Scene);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = Scene.__proto__ || Object.getPrototypeOf(Scene)).call.apply(_ref, [this, sourceObj].concat(properties, [["9058", "isActive", false], // <bool>
		["9068", "isPredefined", true], // <bool>
		["15013", "lightSettings", []], // [<LightSetting>]
		["9057", "sceneIndex", 0], // <int>
		["9070", "useCurrentLightSettings", false]])));
	}

	return Scene;
}(_ipsoDevice2.default);

exports.default = Scene;
//# sourceMappingURL=../maps/ipso/scene.js.map
