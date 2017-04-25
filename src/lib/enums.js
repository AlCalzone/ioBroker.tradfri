"use strict";

import { entries } from "./object-polyfill";

export function getEnumValueAsName(enumeration, value) {
	for (let [id, val] of entries(enumeration))
		if (val === value) return id;
	return "";
}