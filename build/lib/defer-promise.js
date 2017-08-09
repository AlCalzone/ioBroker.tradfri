"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createDeferredPromise() {
    var res;
    var rej;
    var promise = new Promise(function (resolve, reject) {
        res = resolve;
        rej = reject;
    });
    promise.resolve = res;
    promise.reject = rej;
    return promise;
}
exports.createDeferredPromise = createDeferredPromise;
//# sourceMappingURL=defer-promise.js.map