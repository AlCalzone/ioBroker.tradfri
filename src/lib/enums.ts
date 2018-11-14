import { entries } from "alcalzone-shared/objects";

export interface Enumeration { [id: string]: number; }

export function getEnumValueAsName(enumeration: Enumeration, value: number) {
	for (const [id, val] of entries(enumeration)) {
		if (val === value) return id;
	}
	return "";
}
