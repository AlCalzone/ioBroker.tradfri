export declare type Predicate<T> = (value: T) => boolean;
export declare type KeyValuePair<T> = [string, T];
export declare function dig<T = any>(object: Record<string, T>, path: string): unknown;
export declare function bury<T = any>(object: Record<string, T>, path: string, value: any): void;
