import { Accessory, GroupInfo, TradfriClient } from "node-tradfri-client";
import { VirtualGroup } from "../lib/virtual-group";

export class Session {
	public tradfri: TradfriClient;

	/** dictionary of known devices */
	public devices: Record<string, Accessory> = {};
	/** dictionary of known groups */
	public groups: Record<string, GroupInfo> = {};
	/** dictionary of known virtual groups */
	public virtualGroups: Record<string, VirtualGroup> = {};
	// dictionary of ioBroker objects
	public objects: Record<string, ioBroker.Object> = {};
}

export const session = new Session();
