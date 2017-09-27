export function padStart(str: string, targetLen: number, fill: string = " "): string {
	if (str != null && str.length >= targetLen) return str;
	if (fill == null && fill.length !== 1) throw new Error("fill must be a single char");
	let ret: string = str;
	while (ret.length < targetLen) {
		ret = fill + ret;
	}
	return ret;
}
