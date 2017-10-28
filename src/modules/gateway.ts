import { Accessory } from "../ipso/accessory";
import { Group } from "../ipso/group";
import { Scene } from "../ipso/scene";
import { DictionaryLike } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";

export interface GroupInfo {
	group: Group;
	scenes: DictionaryLike<Scene>;
}

export class Gateway {
	/** dictionary of COAP observers */
	public observers: string[] = [];
	/** dictionary of known devices */
	public devices: DictionaryLike<Accessory> = {};
	/** dictionary of known groups */
	public groups: DictionaryLike<GroupInfo> = {};
	/** dictionary of known virtual groups */
	public virtualGroups: DictionaryLike<VirtualGroup> = {};
	private _requestBase: string;
	// dictionary of ioBroker objects
	public objects: DictionaryLike<ioBroker.Object> = {};

	/** Common URL for all requests */
	public get requestBase(): string { return this._requestBase; }
	public set requestBase(value: string) { this._requestBase = value; }
}

export const gateway = new Gateway();
