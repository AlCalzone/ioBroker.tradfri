"use strict";
// tslint:disable:curly
Object.defineProperty(exports, "__esModule", { value: true });
///
/// Stellt Erweiterungsmethoden für Arrays bereit
///
/**
 * Gibt die Schnittmenge zweier numerischer Arrays aus,
 * es wird angenommen, dass sie schon sortiert sind
 * @param a
 * @param b
 */
function intersect(a, b) {
    let ai = 0;
    let bi = 0;
    const ret = [];
    while ((ai < a.length) && (bi < b.length)) {
        if (a[ai] < b[bi])
            ai++;
        else if (a[ai] > b[bi])
            bi++;
        else {
            ret.push(a[ai]);
            ai++;
            bi++;
        }
    }
    return ret;
}
exports.intersect = intersect;
/// gibt die Elemente zurück, die in a, aber nicht in b sind.
function except(a, b) {
    return a.filter((el) => b.indexOf(el) === -1);
}
exports.except = except;
/// Erzeugt ein Range-Array
function range(min, max) {
    // Potentiell Reihenfolge tauschen
    if (min > max)
        [max, min] = [min, max];
    const N = max - min + 1;
    return Array.from(new Array(N), (_, index) => index + min);
}
exports.range = range;
// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
function firstOrDefault(arr, filter) {
    for (const item of arr) {
        if (filter(item))
            return item;
    }
    return null;
}
exports.firstOrDefault = firstOrDefault;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXktZXh0ZW5zaW9ucy5qcyIsInNvdXJjZVJvb3QiOiJEOi9pb0Jyb2tlci50cmFkZnJpL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9hcnJheS1leHRlbnNpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1QkFBdUI7O0FBRXZCLEdBQUc7QUFDSCxpREFBaUQ7QUFDakQsR0FBRztBQUVIOzs7OztHQUtHO0FBQ0gsbUJBQTBCLENBQVcsRUFBRSxDQUFXO0lBQ2pELElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNYLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNYLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUVmLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1FBQzNDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakIsRUFBRSxFQUFFLENBQUM7UUFDTixJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0QixFQUFFLEVBQUUsQ0FBQztRQUNOLElBQUksQ0FBQyxDQUFDO1lBQ0wsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQixFQUFFLEVBQUUsQ0FBQztZQUNMLEVBQUUsRUFBRSxDQUFDO1FBQ04sQ0FBQztJQUNGLENBQUM7SUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDO0FBQ1osQ0FBQztBQWxCRCw4QkFrQkM7QUFFRCw2REFBNkQ7QUFDN0QsZ0JBQTBCLENBQU0sRUFBRSxDQUFNO0lBQ3ZDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRkQsd0JBRUM7QUFFRCwyQkFBMkI7QUFDM0IsZUFBc0IsR0FBVyxFQUFFLEdBQVc7SUFDN0Msa0NBQWtDO0lBQ2xDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUV2QyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUN4QixNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLEtBQUssS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQzVELENBQUM7QUFORCxzQkFNQztBQUVELDBGQUEwRjtBQUMxRix3QkFBa0MsR0FBUSxFQUFFLE1BQTRCO0lBQ3ZFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUMvQixDQUFDO0lBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztBQUNiLENBQUM7QUFMRCx3Q0FLQyJ9