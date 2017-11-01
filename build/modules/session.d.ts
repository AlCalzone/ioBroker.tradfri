import { Accessory, GroupInfo, TradfriClient, TradfriObserverAPI } from "node-tradfri-client";
import { DictionaryLike } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";
export declare class Session {
    tradfri: TradfriClient;
    observer: TradfriObserverAPI;
    /** dictionary of known devices */
    devices: DictionaryLike<Accessory>;
    /** dictionary of known groups */
    groups: DictionaryLike<GroupInfo>;
    /** dictionary of known virtual groups */
    virtualGroups: DictionaryLike<VirtualGroup>;
    objects: DictionaryLike<ioBroker.Object>;
}
export declare const session: Session;
