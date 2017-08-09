export declare type PromiseFactory = (...args: any[]) => Promise<any>;
export declare type PromiseResolver = (value?: {} | PromiseLike<{}>) => void;
export declare type PromiseRejector = (reason?: any) => void;
export declare class Mutex {
    private busy;
    private queue;
    synchronize(task: PromiseFactory): Promise<{}>;
    private dequeue();
    private execute(job);
}
