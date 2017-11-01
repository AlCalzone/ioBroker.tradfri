import { Accessory, GroupInfo, TradfriClient, TradfriObserverAPI } from "node-tradfri-client";
import { DictionaryLike } from "../lib/object-polyfill";
import { VirtualGroup } from "../lib/virtual-group";

export class Session {
	public tradfri: TradfriClient;
	public observer: TradfriObserverAPI;

	/** dictionary of known devices */
	public devices: DictionaryLike<Accessory> = {};
	/** dictionary of known groups */
	public groups: DictionaryLike<GroupInfo> = {};
	/** dictionary of known virtual groups */
	public virtualGroups: DictionaryLike<VirtualGroup> = {};
	// dictionary of ioBroker objects
	public objects: DictionaryLike<ioBroker.Object> = {};
}

export const session = new Session();
