"use strict";
//import IPSOObject from "./ipsoObject";
import IPSODevice from "./ipsoDevice";

// contains information about the gateway
export default class GatewayDetails extends IPSODevice {

	constructor(sourceObj, ...properties) {
		super(sourceObj, ...properties,
			["9023", "ntpServerUrl", ""],
			["9029", "version", ""],
			["9054", "updateState", 0], // <int> => which enum?
			["9055", "updateProgress", 100],  // <int>
			["9056", "updateDetailsURL", ""], // <string> => what is this?
			["9059", "currentTimestamp", 0], // <long>
			["9060", "UNKNOWN1", ""], // <string> => something to do with commissioning? XML-Date
			["9061", "commissioningMode", 0], // <int> => which enum?
			["9062", "UNKNOWN2", 0], // <int> => something more with commissioning?
			["9066", "updatePriority", 0], // <updatePriority>
			["9069", "updateAcceptedTimestamp", 0], // <int>
			["9071", "timeSource", -1], // <int>
			["9072", "UNKNOWN3", 0], // <int/bool> => what is this?
			["9073", "UNKNOWN4", 0], // <int/bool> => what is this?
			["9074", "UNKNOWN5", 0], // <int/bool> => what is this?
			["9075", "UNKNOWN6", 0], // <int/bool> => what is this?
			["9076", "UNKNOWN7", 0], // <int/bool> => what is this?
			["9077", "UNKNOWN8", 0], // <int/bool> => what is this?
			["9078", "UNKNOWN9", 0], // <int/bool> => what is this?
			["9079", "UNKNOWN10", 0], // <int/bool> => what is this?
			["9080", "UNKNOWN11", 0], // <int/bool> => what is this?
			["9081", "UNKNOWN12", ""], // some kind of hex code
			// are those used?
			["9032", "FORCE_CHECK_OTA_UPDATE", ""],
			["9035", "name", ""],
		);
	}

}