// TODO: check if we still need this.

// source: https://blog.jcoglan.com/2016/07/12/mutexes-and-javascript/

export type PromiseFactory = (...args: any[]) => Promise<any>;
export type PromiseResolver = (value?: {} | PromiseLike<{}>) => void;
export type PromiseRejector = (reason?: any) => void;
type Job = [PromiseFactory, PromiseResolver, PromiseRejector];

/* usage:
const result (<Promise>) = mutex.synchronize( <promise returning function> );
*/
export class Mutex {

	private busy: boolean = false;
	private queue: Job[] = [];

	public synchronize(task: PromiseFactory) {
		// Task must be a promise returning function

		return new Promise((resolve, reject) => {
			this.queue.push([task, resolve, reject]);
			if (!this.busy) this.dequeue();
		});

	}

	private dequeue() {
		this.busy = true;

		const next = this.queue.shift();
		if (next) {
			this.execute(next);
		} else {
			this.busy = false;
		}
	}

	private execute(job: Job) {
		const [task, resolve, reject] = job;

		task()
			.then(resolve, reject)
			.then(() => this.dequeue())
			;
	}

}
