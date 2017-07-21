"use strict";

// TODO: check if we still need this.

// source: https://blog.jcoglan.com/2016/07/12/mutexes-and-javascript/

const
	busy = Symbol("busy"),
	queue = Symbol("queue"),
	dequeue = Symbol("dequeue"),
	execute = Symbol("execute")
	;

/* usage:
const result (<Promise>) = mutex.synchronize( <promise returning function> );
*/
export default class Mutex {

	constructor() {
		this[busy] = false;
		this[queue] = [];
	}

	synchronize(task) {
		// Task must be a promise returning function

		return new Promise((resolve, reject) => {
			this[queue].push([task, resolve, reject]);
			if (!this[busy]) this[dequeue]();
		});

	}

	[dequeue]() {
		this[busy] = true;

		const next = this[queue].shift();
		if (next)
			this[execute](next);
		else
			this[busy] = false;
	}

	[execute](job) {
		// Array-Parameter scheinen nicht zu funktionieren :(
		const
			task = job[0],
			resolve = job[1],
			reject = job[2]
			;
		task()
			.then(resolve, reject)
			.then(() => this[dequeue]())
			;
	}

}