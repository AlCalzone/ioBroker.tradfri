"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = str2regex;
function str2regex(pattern) {
	pattern = new RegExp(pattern.replace(".", "\.") // Punkte als solche matchen
	.replace("*", ".*") // Wildcard in Regex umsetzen
	.replace("!", "?!") // negative lookahead
	);
	return pattern;
}
//# sourceMappingURL=../maps/lib/str2regex.js.map
