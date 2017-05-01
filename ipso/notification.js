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
var Notification = function (_IPSODevice) {
	_inherits(Notification, _IPSODevice);

	function Notification(sourceObj) {
		var _ref;

		_classCallCheck(this, Notification);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		return _possibleConstructorReturn(this, (_ref = Notification.__proto__ || Object.getPrototypeOf(Notification)).call.apply(_ref, [this, sourceObj].concat(properties, [["9015", "event", 0], // <int> -> notificationType
		["9017", "details", {}, function (arr) {
			return parseNotificationDetails(arr);
		}], // -> <dictionary> (from "key=value"-Array)
		["9014", "state", 0]])));
	}

	return Notification;
}(_ipsoDevice2.default);

exports.default = Notification;


function parseNotificationDetails(kvpList) {
	var ret = {};
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = kvpList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var kvp = _step.value;

			var parts = kvp.split("=");
			ret[parts[0]] = parts[1];
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	return ret;
}
//# sourceMappingURL=../maps/ipso/notification.js.map
