import { Accessory } from "../ipso/accessory";
import { Group } from "../ipso/group";
import { Scene } from "../ipso/scene";
import { DictionaryLike } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";
export interface GroupInfo {
    group: Group;
    scenes: DictionaryLike<Scene>;
}
export declare class Gateway {
    /** dictionary of COAP observers */
    observers: string[];
    /** dictionary of known devices */
    devices: DictionaryLike<Accessory>;
    /** dictionary of known groups */
    groups: DictionaryLike<GroupInfo>;
    /** dictionary of known virtual groups */
    virtualGroups: DictionaryLike<VirtualGroup>;
    private _requestBase;
    objects: DictionaryLike<ioBroker.Object>;
    /** Common URL for all requests */
    requestBase: string;
}
export declare const gateway: Gateway;
