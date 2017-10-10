"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const object_polyfill_1 = require("./object-polyfill");
function getEnumValueAsName(enumeration, value) {
    for (const [id, val] of object_polyfill_1.entries(enumeration)) {
        if (val === value)
            return id;
    }
    return "";
}
exports.getEnumValueAsName = getEnumValueAsName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bXMuanMiLCJzb3VyY2VSb290IjoiRDovaW9Ccm9rZXIudHJhZGZyaS9zcmMvIiwic291cmNlcyI6WyJsaWIvZW51bXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx1REFBNEM7QUFJNUMsNEJBQW1DLFdBQXdCLEVBQUUsS0FBYTtJQUN6RSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxJQUFJLHlCQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxLQUFLLENBQUM7WUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQzlCLENBQUM7SUFDRCxNQUFNLENBQUMsRUFBRSxDQUFDO0FBQ1gsQ0FBQztBQUxELGdEQUtDIn0=