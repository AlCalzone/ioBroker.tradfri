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

// 
var Group = function (_IPSODevice) {
	_inherits(Group, _IPSODevice);

	function Group(sourceObj) {
		var _ref;

		_classCallCheck(this, Group);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = Group.__proto__ || Object.getPrototypeOf(Group)).call.apply(_ref, [this, sourceObj].concat(properties, [["5850", "onOff", false], // <bool>
		["5851", "dimmer", 0], // <int> [0..254]
		["9039", "sceneId", []], // <int> or [<int>]
		["9018", "deviceIDs", [], function (obj) {
			return parseAccessoryLink(obj);
		}]])));
	}

	return Group;
}(_ipsoDevice2.default);

exports.default = Group;


function parseAccessoryLink(link) {
	var hsLink = link["15002"];
	var deviceIDs = hsLink["9003"];
	return deviceIDs;
}
//# sourceMappingURL=../maps/ipso/group.js.map
