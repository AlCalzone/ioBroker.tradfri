// tslint:disable:curly
"use strict";
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
    var ai = 0;
    var bi = 0;
    var ret = [];
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
    return a.filter(function (el) { return b.indexOf(el) === -1; });
}
exports.except = except;
/// Erzeugt ein Range-Array
function range(min, max) {
    // Potentiell Reihenfolge tauschen
    if (min > max)
        _a = [min, max], max = _a[0], min = _a[1];
    var N = max - min + 1;
    return Array.from(new Array(N), function (_, index) { return index + min; });
    var _a;
}
exports.range = range;
// Gibt das erste Element eines Array zurück, das mit dem angegebenen Filter übereinstimmt
function firstOrDefault(arr, filter) {
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var item = arr_1[_i];
        if (filter(item))
            return item;
    }
    return null;
}
exports.firstOrDefault = firstOrDefault;
//# sourceMappingURL=array-extensions.js.map