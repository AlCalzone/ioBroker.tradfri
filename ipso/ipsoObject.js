"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _objectPolyfill = require("../lib/object-polyfill");

var _global = require("../lib/global");

var _global2 = _interopRequireDefault(_global);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var parsers = Symbol("parsers"),
    deserialize = Symbol("deserialize"),
    parseValue = Symbol("parseValue"),
    getParser = Symbol("getParser"),
    keys = Symbol("keys"),
    propNames = Symbol("propNames"),
    defaultValues = Symbol("defaultValues"),
    defineProperties = Symbol("defineProperties");

// common base class for all objects that are transmitted somehow

var IPSOObject = function () {
	function IPSOObject(sourceObj) {
		_classCallCheck(this, IPSOObject);

		for (var _len = arguments.length, properties = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			properties[_key - 1] = arguments[_key];
		}

		// define properties if neccessary
		if (_global2.default.isdef(properties)) this[defineProperties](properties);

		// parse the contents of the source object
		if (_global2.default.isdef(source)) this[parse](source);
	}

	_createClass(IPSOObject, [{
		key: defineProperties,
		value: function value() {
			this[keys] = {}; // lookup dictionary for propName => key
			this[propNames] = {}; // lookup dictionary for key => propName
			this[defaultValues] = {}; // lookup dictionary for key => default property value
			this[parsers] = {}; // // lookup dictionary for key => property parser

			for (var _len2 = arguments.length, properties = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
				properties[_key2] = arguments[_key2];
			}

			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = properties[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _ref = _step.value;

					var _ref2 = _toArray(_ref);

					var _key3 = _ref2[0];
					var name = _ref2[1];

					var options = _ref2.slice(2);

					// populate key lookup table
					this[keys][name] = _key3;
					this[propNames][_key3] = name;
					if (options && options.length) {
						// default value, set property
						this[defaultValues][_key3] = options[0];
						this[name] = options[0];
						// parser
						if (options.length >= 1) this[parsers][_key3] = options[1];
					}
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
		}

		//// defines a parser function for partial objects
		//defineParser(key, fn) {
		//	if (!this[parsers].hasOwnProperty(key)) this[parsers][key] = fn;
		//}

	}, {
		key: getParser,
		value: function value(key) {
			if (this[parsers].hasOwnProperty(key)) return this[parsers][key];
		}

		// parses an object

	}, {
		key: deserialize,
		value: function value(obj) {
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = (0, _objectPolyfill.entries)(obj)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var _ref3 = _step2.value;

					var _ref4 = _slicedToArray(_ref3, 2);

					var _key4 = _ref4[0];
					var value = _ref4[1];

					// which property are we parsing?
					var propName = this.getPropName(_key4);
					if (!propName) {
						_global2.default.log(`{{yellow}}found unknown property with key ${_key4}`);
						continue;
					}
					// try to find parser for this property
					var parser = this[getParser](_key4);
					// parse the value
					var parsedValue = this[parseValue](_key4, value, parser);
					// and remember it
					this[propName] = value;
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}
		}
		// parses a value, depending on the value type and defined parsers

	}, {
		key: parseValue,
		value: function value(propKey, _value) {
			var _this = this;

			var parser = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

			if (_value instanceof Array) {
				// Array: parse every element
				return _value.map(function (v) {
					return _this[parseValue](propKey, _value, parser);
				});
			} else if (typeof _value === "object") {
				// Object: try to parse this, objects should be parsed in any case
				if (parser) {
					_value = parser(_value);
				} else {
					_global2.default.log(`{{yellow}}could not find property parser for key ${key}`);
					return _value;
				}
			} else if (parser) {
				// if this property needs a parser, parse the value
				return parser(_value);
			} else {
				// otherwise just return the value
				return _value;
			}
		}
	}, {
		key: "getKey",
		value: function getKey(propName) {
			return this[keys][propName];
		}
	}, {
		key: "getPropName",
		value: function getPropName(key) {
			return this[propNames][key];
		}

		// serializes this object in order to transfer it via COAP

	}, {
		key: "serialize",
		value: function serialize() {
			var ret = {};
			// check all set properties
			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = this[propNames][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var propName = _step3.value;

					if (this.hasOwnProperty(propName)) {
						var _key5 = this.getKey(propName);
						var value = this[propName];
						if (value instanceof IPSOObject) {
							// if the value is another IPSOObject, then serialize that
							value = value.serialize();
						} else {
							// if the value is not the default one, then remember it
							if (this[defaultValues].hasOwnProperty(_key5)) {
								var defaultValue = this[defaultValues][_key5];
								if (defaultValue === value) continue;
							} else {
								// there is no default value, just remember the actual value
							}
						}

						ret[_key5] = value;
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}

			return ret;
		}
	}]);

	return IPSOObject;
}();

exports.default = IPSOObject;
//# sourceMappingURL=../maps/ipso/ipsoObject.js.map
