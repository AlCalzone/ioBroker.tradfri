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
		if (_global2.default.isdef(sourceObj)) this[deserialize](sourceObj);
	}

	_createClass(IPSOObject, [{
		key: defineProperties,
		value: function value(properties) {
			this[keys] = {}; // lookup dictionary for propName => key
			this[propNames] = {}; // lookup dictionary for key => propName
			this[defaultValues] = {}; // lookup dictionary for key => default property value
			this[parsers] = {}; // // lookup dictionary for key => property parser

			for (var index in properties) {
				var _properties$index = _toArray(properties[index]),
				    key = _properties$index[0],
				    name = _properties$index[1],
				    options = _properties$index.slice(2);
				// populate key lookup table


				this[keys][name] = key;
				this[propNames][key] = name;
				if (options && options.length) {
					// default value, set property
					this[defaultValues][key] = options[0];
					this[name] = options[0];
					// parser
					if (options.length >= 1) this[parsers][key] = options[1];
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
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = (0, _objectPolyfill.entries)(obj)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var _ref = _step.value;

					var _ref2 = _slicedToArray(_ref, 2);

					var key = _ref2[0];
					var value = _ref2[1];

					// which property are we parsing?
					var propName = this.getPropName(key);
					if (!propName) {
						_global2.default.log(`{{yellow}}found unknown property with key ${key}`);
						continue;
					}
					// try to find parser for this property
					var parser = this[getParser](key);
					// parse the value
					var parsedValue = this[parseValue](key, value, parser);
					// and remember it
					this[propName] = parsedValue;
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
		// parses a value, depending on the value type and defined parsers

	}, {
		key: parseValue,
		value: function value(propKey, _value) {
			var _this = this;

			var parser = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

			if (_value instanceof Array) {
				// Array: parse every element
				return _value.map(function (v) {
					return _this[parseValue](propKey, v, parser);
				});
			} else if (typeof _value === "object") {
				// Object: try to parse this, objects should be parsed in any case
				if (parser) {
					return parser(_value);
				} else {
					_global2.default.log(`{{yellow}}could not find property parser for key ${propKey}`);
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
			var _this2 = this;

			var reference = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

			var ret = {};

			var serializeValue = function serializeValue(key, propName, value, refValue) {
				if (value instanceof IPSOObject) {
					// if the value is another IPSOObject, then serialize that
					value = value.serialize(refValue);
				} else {
					// if the value is not the default one, then remember it
					if (_global2.default.isdef(refValue)) {
						if (refValue === value) return null;
					} else {
						// there is no default value, just remember the actual value
					}
				}
				return value;
			};

			var refObj = reference || this[defaultValues];
			// check all set properties

			var _loop = function _loop(propName) {
				if (_this2.hasOwnProperty(propName)) {
					var key = _this2.getKey(propName);
					var value = _this2[propName];
					var refValue = null;
					if (_global2.default.isdef(refObj) && refObj.hasOwnProperty(propName)) refValue = refObj[propName];

					if (value instanceof Array) {
						// serialize each item
						if (_global2.default.isdef(refValue)) {
							// reference value exists, make sure we have the same amount of items
							if (!(refValue instanceof Array && refValue.length === value.length)) {
								throw "cannot serialize arrays when the reference values don't match";
							}
							// serialize each item with the matching reference value
							value = value.map(function (v, i) {
								return serializeValue(key, propName, v, refValue[i]);
							});
						} else {
							// no reference value, makes things easier
							value = value.map(function (v) {
								return serializeValue(key, propName, v, null);
							});
						}
						// now remove null items
						value = value.filter(function (v) {
							return _global2.default.isdef(v);
						});
					} else {
						// directly serialize the value
						value = serializeValue(key, propName, value, refValue);
					}

					ret[key] = value;
				}
			};

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = this[propNames][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var propName = _step2.value;

					_loop(propName);
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

			return ret;
		}
	}]);

	return IPSOObject;
}();

exports.default = IPSOObject;
//# sourceMappingURL=../maps/ipso/ipsoObject.js.map
