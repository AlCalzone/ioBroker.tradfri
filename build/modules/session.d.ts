/// <reference types="iobroker" />
import { Accessory, GroupInfo, TradfriClient } from "node-tradfri-client";
import { VirtualGroup } from "../lib/virtual-group";
export declare class Session {
    tradfri: TradfriClient;
    /** dictionary of known devices */
    devices: Record<string, Accessory>;
    /** dictionary of known groups */
    groups: Record<string, GroupInfo>;
    /** dictionary of known virtual groups */
    virtualGroups: Record<string, VirtualGroup>;
    objects: Record<string, ioBroker.Object>;
}
export declare const session: Session;
