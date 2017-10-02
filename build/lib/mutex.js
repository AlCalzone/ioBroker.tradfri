"use strict";
// TODO: check if we still need this.
Object.defineProperty(exports, "__esModule", { value: true });
/* usage:
const result (<Promise>) = mutex.synchronize( <promise returning function> );
*/
class Mutex {
    constructor() {
        this.busy = false;
        this.queue = [];
    }
    synchronize(task) {
        // Task must be a promise returning function
        return new Promise((resolve, reject) => {
            this.queue.push([task, resolve, reject]);
            if (!this.busy)
                this.dequeue();
        });
    }
    dequeue() {
        this.busy = true;
        const next = this.queue.shift();
        if (next) {
            this.execute(next);
        }
        else {
            this.busy = false;
        }
    }
    execute(job) {
        const [task, resolve, reject] = job;
        task()
            .then(resolve, reject)
            .then(() => this.dequeue());
    }
}
exports.Mutex = Mutex;
//# sourceMappingURL=mutex.js.map