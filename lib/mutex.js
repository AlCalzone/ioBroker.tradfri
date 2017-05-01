"use strict";

// source: https://blog.jcoglan.com/2016/07/12/mutexes-and-javascript/

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var busy = Symbol("busy"),
    queue = Symbol("queue"),
    dequeue = Symbol("dequeue"),
    execute = Symbol("execute");

/* usage:
const result (<Promise>) = mutex.synchronize( <promise returning function> );
*/

var Mutex = function () {
	function Mutex() {
		_classCallCheck(this, Mutex);

		this[busy] = false;
		this[queue] = [];
	}

	_createClass(Mutex, [{
		key: "synchronize",
		value: function synchronize(task) {
			var _this = this;

			// Task must be a promise returning function

			return new Promise(function (resolve, reject) {
				_this[queue].push([task, resolve, reject]);
				if (!_this[busy]) _this[dequeue]();
			});
		}
	}, {
		key: dequeue,
		value: function value() {
			this[busy] = true;

			var next = this[queue].shift();
			if (next) this[execute](next);else this[busy] = false;
		}
	}, {
		key: execute,
		value: function value(job) {
			var _this2 = this;

			// Array-Parameter scheinen nicht zu funktionieren :(
			var task = job[0],
			    resolve = job[1],
			    reject = job[2];
			task().then(resolve, reject).then(function () {
				return _this2[dequeue]();
			});
		}
	}]);

	return Mutex;
}();

exports.default = Mutex;
//# sourceMappingURL=../maps/lib/mutex.js.map
