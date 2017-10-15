import { IPSOObject } from "./ipsoObject";
export declare class IPSODevice extends IPSOObject {
    name: string;
    createdAt: number;
    instanceId: number;
    /** Creates a proxy device */
    createProxy(): this;
}
