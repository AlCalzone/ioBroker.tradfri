"use strict";

export default function str2regex(pattern) {
	pattern = new RegExp(
		pattern
			.replace(".", "\.") // Punkte als solche matchen
			.replace("*", ".*") // Wildcard in Regex umsetzen
			.replace("!", "?!") // negative lookahead
	);
	return pattern;
}