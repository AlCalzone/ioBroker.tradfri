"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
exports.serializers = {
    color: ((value) => {
        const [min, max] = [24930, 33135];
        // extrapolate 0-100% to [min..max]
        value = math_1.clamp(value, 0, 100);
        return math_1.roundTo(min + value / 100 * (max - min), 0);
    }),
    // the sent value is in 10ths of seconds, we're working with seconds
    transitionTime: (val => val * 10),
};
exports.deserializers = {
    color: ((value) => {
        const [min, max] = [24930, 33135];
        // interpolate "color percentage" from the colorX range of a lightbulb
        value = (value - min) / (max - min);
        value = math_1.clamp(value, 0, 1);
        return math_1.roundTo(value * 100, 0);
    }),
    // the sent value is in 10ths of seconds, we're working with seconds
    transitionTime: (val => val / 10),
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVyc2lvbnMuanMiLCJzb3VyY2VSb290IjoiRDovaW9Ccm9rZXIudHJhZGZyaS9zcmMvIiwic291cmNlcyI6WyJsaWIvY29udmVyc2lvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxpQ0FBd0M7QUFHM0IsUUFBQSxXQUFXLEdBQUc7SUFDMUIsS0FBSyxFQUFFLENBQUMsQ0FBQyxLQUFLO1FBQ2IsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxtQ0FBbUM7UUFDbkMsS0FBSyxHQUFHLFlBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxjQUFPLENBQUMsR0FBRyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQyxDQUFzQjtJQUV2QixvRUFBb0U7SUFDcEUsY0FBYyxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQXNCO0NBQ3RELENBQUM7QUFFVyxRQUFBLGFBQWEsR0FBRztJQUM1QixLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUs7UUFDYixNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLHNFQUFzRTtRQUN0RSxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDcEMsS0FBSyxHQUFHLFlBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sQ0FBQyxjQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNoQyxDQUFDLENBQXNCO0lBRXZCLG9FQUFvRTtJQUNwRSxjQUFjLEVBQUUsQ0FBQyxHQUFHLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBc0I7Q0FDdEQsQ0FBQyJ9