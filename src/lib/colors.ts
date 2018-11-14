// accept a bunch of stuff that follows 2 rules
// 1. ends with 6 hex digits
// 2. the remainder does not contain letters or digits
const hexColorRegex = /^[^a-zA-Z0-9]*([a-fA-F0-9]{6})$/;
/** Normalizes any input that might represent a hex color. Returns undefined if no match was found */
export function normalizeHexColor(color: string): string | undefined {
	const match = hexColorRegex.exec(color);
	if (match && match.length > 1) return match[1];
}
