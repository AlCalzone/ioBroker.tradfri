"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:trailing-comma
function str2regex(pattern) {
    return new RegExp(pattern
        .replace(/\./g, "\.") // Punkte als solche matchen
        .replace(/\*/g, ".*") // Wildcard in Regex umsetzen
        .replace(/\!/g, "?!") // negative lookahead
    );
}
exports.str2regex = str2regex;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyMnJlZ2V4LmpzIiwic291cmNlUm9vdCI6IkQ6L2lvQnJva2VyLnRyYWRmcmkvc3JjLyIsInNvdXJjZXMiOlsibGliL3N0cjJyZWdleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGdDQUFnQztBQUNoQyxtQkFBMEIsT0FBZTtJQUN4QyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQ2hCLE9BQU87U0FDTCxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLDRCQUE0QjtTQUNqRCxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLDZCQUE2QjtTQUNsRCxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLHFCQUFxQjtLQUM1QyxDQUFDO0FBQ0gsQ0FBQztBQVBELDhCQU9DIn0=