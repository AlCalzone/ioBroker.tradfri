"use strict";
///
/// Stellt einen Polyfill für Object.entries bereit
///

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.entries = entries;
exports.values = values;
exports.filter = filter;
exports.composeObject = composeObject;
exports.dig = dig;
exports.bury = bury;
exports.extend = extend;

var _marked = [entries, values].map(regeneratorRuntime.mark);

function entries(obj) {
	var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, key;

	return regeneratorRuntime.wrap(function entries$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					_iteratorNormalCompletion = true;
					_didIteratorError = false;
					_iteratorError = undefined;
					_context.prev = 3;
					_iterator = Object.keys(obj)[Symbol.iterator]();

				case 5:
					if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
						_context.next = 12;
						break;
					}

					key = _step.value;
					_context.next = 9;
					return [key, obj[key]];

				case 9:
					_iteratorNormalCompletion = true;
					_context.next = 5;
					break;

				case 12:
					_context.next = 18;
					break;

				case 14:
					_context.prev = 14;
					_context.t0 = _context["catch"](3);
					_didIteratorError = true;
					_iteratorError = _context.t0;

				case 18:
					_context.prev = 18;
					_context.prev = 19;

					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}

				case 21:
					_context.prev = 21;

					if (!_didIteratorError) {
						_context.next = 24;
						break;
					}

					throw _iteratorError;

				case 24:
					return _context.finish(21);

				case 25:
					return _context.finish(18);

				case 26:
				case "end":
					return _context.stop();
			}
		}
	}, _marked[0], this, [[3, 14, 18, 26], [19,, 21, 25]]);
}

///
/// Stellt einen Polyfill für Object.values bereit
///
function values(obj) {
	var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, key;

	return regeneratorRuntime.wrap(function values$(_context2) {
		while (1) {
			switch (_context2.prev = _context2.next) {
				case 0:
					_iteratorNormalCompletion2 = true;
					_didIteratorError2 = false;
					_iteratorError2 = undefined;
					_context2.prev = 3;
					_iterator2 = Object.keys(obj)[Symbol.iterator]();

				case 5:
					if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
						_context2.next = 12;
						break;
					}

					key = _step2.value;
					_context2.next = 9;
					return obj[key];

				case 9:
					_iteratorNormalCompletion2 = true;
					_context2.next = 5;
					break;

				case 12:
					_context2.next = 18;
					break;

				case 14:
					_context2.prev = 14;
					_context2.t0 = _context2["catch"](3);
					_didIteratorError2 = true;
					_iteratorError2 = _context2.t0;

				case 18:
					_context2.prev = 18;
					_context2.prev = 19;

					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}

				case 21:
					_context2.prev = 21;

					if (!_didIteratorError2) {
						_context2.next = 24;
						break;
					}

					throw _iteratorError2;

				case 24:
					return _context2.finish(21);

				case 25:
					return _context2.finish(18);

				case 26:
				case "end":
					return _context2.stop();
			}
		}
	}, _marked[1], this, [[3, 14, 18, 26], [19,, 21, 25]]);
}

function filter(obj, predicate) {
	var ret = {};
	var _iteratorNormalCompletion3 = true;
	var _didIteratorError3 = false;
	var _iteratorError3 = undefined;

	try {
		for (var _iterator3 = entries(obj)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
			var _ref = _step3.value;

			var _ref2 = _slicedToArray(_ref, 2);

			var key = _ref2[0];
			var val = _ref2[1];

			if (predicate(val)) ret[key] = val;
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

// Kombinierte mehrere Key-Value-Paare zu einem Objekt
function composeObject(properties) {
	return properties.reduce(function (acc, _ref3) {
		var _ref4 = _slicedToArray(_ref3, 2),
		    key = _ref4[0],
		    value = _ref4[1];

		acc[key] = value;
		return acc;
	}, {});
}

// Gräbt in einem Objekt nach dem Property-Pfad. 
// Bsps: (obj, "common.asdf.qwer") => obj.common.asdf.qwer
function dig(object, path) {
	function _dig(obj, pathArr) {
		// are we there yet? then return obj
		if (!pathArr.length) return obj;
		// go deeper
		var propName = pathArr.shift();
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		return _dig(obj[propName], pathArr);
	}
	return _dig(object, path.split("."));
}

// Vergräbt eine Eigenschaft in einem Objekt (Gegenteil von dig)
function bury(object, path, value) {
	function _bury(obj, pathArr, value) {
		// are we there yet? then return obj
		if (pathArr.length === 1) {
			obj[pathArr] = value;
			return;
		}
		// go deeper
		var propName = pathArr.shift();
		if (/\[\d+\]/.test(propName)) {
			// this is an array index
			propName = +propName.slice(1, -1);
		}
		_bury(obj[propName], pathArr, value);
	}
	_bury(object, path.split("."), value);
}

// Kopiert Eigenschaften rekursiv von einem Objekt auf ein anderes
function extend(target, source) {
	target = target || {};
	var _iteratorNormalCompletion4 = true;
	var _didIteratorError4 = false;
	var _iteratorError4 = undefined;

	try {
		for (var _iterator4 = entries(source)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
			var _ref5 = _step4.value;

			var _ref6 = _slicedToArray(_ref5, 2);

			var prop = _ref6[0];
			var val = _ref6[1];

			if (val instanceof Object) {
				target[prop] = extend(target[prop], val);
			} else {
				target[prop] = val;
			}
		}
	} catch (err) {
		_didIteratorError4 = true;
		_iteratorError4 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion4 && _iterator4.return) {
				_iterator4.return();
			}
		} finally {
			if (_didIteratorError4) {
				throw _iteratorError4;
			}
		}
	}

	return target;
}
//# sourceMappingURL=../maps/lib/object-polyfill.js.map
