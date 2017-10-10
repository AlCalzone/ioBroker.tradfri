"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** limits a value to the range given by min/max */
function clamp(value, min, max) {
    if (min > max) {
        [min, max] = [max, min];
    }
    if (value < min)
        return min;
    if (value > max)
        return max;
    return value;
}
exports.clamp = clamp;
function roundTo(value, digits) {
    const exp = Math.pow(10, digits);
    return Math.round(value * exp) / exp;
}
exports.roundTo = roundTo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0aC5qcyIsInNvdXJjZVJvb3QiOiJEOi9pb0Jyb2tlci50cmFkZnJpL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9tYXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbURBQW1EO0FBQ25ELGVBQXNCLEtBQWEsRUFBRSxHQUFXLEVBQUUsR0FBVztJQUM1RCxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNmLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ3pCLENBQUM7SUFDRCxFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUM1QixFQUFFLENBQUMsQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1FBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQztJQUM1QixNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2QsQ0FBQztBQVBELHNCQU9DO0FBRUQsaUJBQXdCLEtBQWEsRUFBRSxNQUFjO0lBQ3BELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDdEMsQ0FBQztBQUhELDBCQUdDIn0=