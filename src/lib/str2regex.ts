export function str2regex(pattern: string): RegExp {
	return new RegExp(
		pattern
			.replace(/\\/g, "\\\\") // Punkte als solche matchen
			.replace(/\./g, "\\.") // Punkte als solche matchen
			.replace(/\*/g, ".*") // Wildcard in Regex umsetzen
			.replace(/\!/g, "?!"), // negative lookahead
	);
}
