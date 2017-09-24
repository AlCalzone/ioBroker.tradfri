"use strict";
// TODO: check if we still need this.
Object.defineProperty(exports, "__esModule", { value: true });
/* usage:
const result (<Promise>) = mutex.synchronize( <promise returning function> );
*/
var Mutex = (function () {
    function Mutex() {
        this.busy = false;
        this.queue = [];
    }
    Mutex.prototype.synchronize = function (task) {
        // Task must be a promise returning function
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.queue.push([task, resolve, reject]);
            if (!_this.busy)
                _this.dequeue();
        });
    };
    Mutex.prototype.dequeue = function () {
        this.busy = true;
        var next = this.queue.shift();
        if (next) {
            this.execute(next);
        }
        else {
            this.busy = false;
        }
    };
    Mutex.prototype.execute = function (job) {
        var _this = this;
        var task = job[0], resolve = job[1], reject = job[2];
        task()
            .then(resolve, reject)
            .then(function () { return _this.dequeue(); });
    };
    return Mutex;
}());
exports.Mutex = Mutex;
//# sourceMappingURL=mutex.js.map