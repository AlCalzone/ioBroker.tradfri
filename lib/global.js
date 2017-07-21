"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _objectPolyfill = require("./object-polyfill");

var _promises = require("./promises");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// ==================================

var colors = {
	"red": "#db3340",
	"yellow": "#ffa200",
	"green": "#5bb12f",
	"blue": "#0087cb"
};

var replacements = {
	bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
	italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
	underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
	strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
	color: [/\{{2}(\w+)\|(.*?)\}{2}/, function (str, p1, p2) {
		var color = colors[p1];
		if (!color) return str;

		return `<span style="color: ${color}">${p2}</span>`;
	}],
	fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, function (str, p1, p2) {
		var color = colors[p1];
		if (!color) return str;

		return `<span style="color: ${color}">${p2}</span>`;
	}]
};

// Singleton-Pattern
var __instance = null;

var _adapter = Symbol("_adapter"),
    _loglevel = Symbol("_loglevel");

var Global = function () {
	function Global() {
		_classCallCheck(this, Global);

		if (__instance) {
			return __instance;
		}
		__instance = this;

		this.loglevels = { "off": 0, "on": 1, "debug": 2 };
		this.severity = { "normal": 0, "warn": 1, "error": 2 };
		this[_loglevel] = this.loglevels.on;
	}

	_createClass(Global, [{
		key: "log",


		/*
  	Formatierungen:
  	**fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
  	schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
  */
		value: function log(message) {
			var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
			    _ref$level = _ref.level,
			    level = _ref$level === undefined ? this.loglevels.on : _ref$level,
			    _ref$severity = _ref.severity,
			    severity = _ref$severity === undefined ? this.severity.normal : _ref$severity;

			if (level < this[_loglevel]) return;
			if (!this[_adapter]) return;

			// Warnstufe auswählen
			var logFn = void 0;
			switch (severity) {
				case this.severity.warn:
					logFn = "warn";
					break;
				case this.severity.error:
					logFn = "error";
					break;
				case this.severity.normal:
				default:
					logFn = "info";
			}
			// Debug überschreibt severity
			if (level === this.loglevels.debug) logFn = "debug";

			if (message) {
				// Farben und Formatierungen
				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = (0, _objectPolyfill.entries)(replacements)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						var _ref2 = _step.value;

						var _ref3 = _slicedToArray(_ref2, 2);

						var _ref3$ = _slicedToArray(_ref3[1], 2);

						var regex = _ref3$[0];
						var repl = _ref3$[1];

						message = message.replace(regex, repl);
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

			this[_adapter].log[logFn](message);
		}

		// Kurzschreibweise für ein Objekt

	}, {
		key: "$",
		value: function () {
			var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(id) {
				return regeneratorRuntime.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								_context.next = 2;
								return this[_adapter].$getForeignObject(id);

							case 2:
								return _context.abrupt("return", _context.sent);

							case 3:
							case "end":
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function $(_x2) {
				return _ref4.apply(this, arguments);
			}

			return $;
		}()

		// Kurzschreibweise für mehrere Objekte

	}, {
		key: "$$",
		value: function () {
			var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(pattern, type, role) {
				var objects;
				return regeneratorRuntime.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return this[_adapter].$getForeignObjects(pattern, type);

							case 2:
								objects = _context2.sent;

								if (!role) {
									_context2.next = 7;
									break;
								}

								return _context2.abrupt("return", (0, _objectPolyfill.filter)(objects, function (o) {
									return o.common.role === role;
								}));

							case 7:
								return _context2.abrupt("return", objects);

							case 8:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function $$(_x3, _x4, _x5) {
				return _ref5.apply(this, arguments);
			}

			return $$;
		}()

		// Prüfen auf (un)defined

	}, {
		key: "isdef",
		value: function isdef(value) {
			return value != undefined;
		}
	}, {
		key: "adapter",
		get: function get() {
			return this[_adapter];
		},
		set: function set(adapter) {
			this[_adapter] = adapter;

			// Eine Handvoll Funktionen promisifizieren
			adapter.objects.$getObjectList = (0, _promises.promisify)(adapter.objects.getObjectList, adapter.objects);
			adapter.$getForeignObject = (0, _promises.promisify)(adapter.getForeignObject, adapter);
			adapter.$setForeignObject = (0, _promises.promisify)(adapter.setForeignObject, adapter);
			adapter.$getForeignObjects = (0, _promises.promisify)(adapter.getForeignObjects, adapter);
			adapter.$getForeignState = (0, _promises.promisify)(adapter.getForeignState, adapter);
			adapter.$setForeignState = (0, _promises.promisify)(adapter.setForeignState, adapter);
			adapter.$getObject = (0, _promises.promisify)(adapter.getObject, adapter);
			adapter.$setObject = (0, _promises.promisify)(adapter.setObject, adapter);
			adapter.$getState = (0, _promises.promisify)(adapter.getState, adapter);
			adapter.$setState = (0, _promises.promisify)(adapter.setState, adapter);

			adapter.$createOwnState = function () {
				var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(id, initialValue) {
					var ack = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
					var type = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "state";
					var commonType = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : "mixed";
					return regeneratorRuntime.wrap(function _callee3$(_context3) {
						while (1) {
							switch (_context3.prev = _context3.next) {
								case 0:
									_context3.next = 2;
									return adapter.$setObject(id, {
										common: {
											name: id,
											role: "value",
											type: commonType
										},
										native: {},
										type: type
									});

								case 2:
									if (!(initialValue != undefined)) {
										_context3.next = 5;
										break;
									}

									_context3.next = 5;
									return adapter.$setState(id, initialValue, ack);

								case 5:
								case "end":
									return _context3.stop();
							}
						}
					}, _callee3, this);
				}));

				return function (_x9, _x10) {
					return _ref6.apply(this, arguments);
				};
			}();
			adapter.$createOwnStateEx = function () {
				var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(id, obj, initialValue) {
					var ack = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
					return regeneratorRuntime.wrap(function _callee4$(_context4) {
						while (1) {
							switch (_context4.prev = _context4.next) {
								case 0:
									_context4.next = 2;
									return adapter.$setObject(id, obj);

								case 2:
									if (!(initialValue != undefined)) {
										_context4.next = 5;
										break;
									}

									_context4.next = 5;
									return adapter.$setState(id, initialValue, ack);

								case 5:
								case "end":
									return _context4.stop();
							}
						}
					}, _callee4, this);
				}));

				return function (_x12, _x13, _x14) {
					return _ref7.apply(this, arguments);
				};
			}();
		}
	}, {
		key: "loglevel",
		get: function get() {
			return this[_loglevel];
		},
		set: function set(value) {
			this[_loglevel] = value;
		}
	}]);

	return Global;
}();

// ==================================

var stuff = new Global();
exports.default = stuff;
//export default const stuff = new Global();
//# sourceMappingURL=../maps/lib/global.js.map
