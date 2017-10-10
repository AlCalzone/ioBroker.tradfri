"use strict";
///
/// Stellt einen Promise-Wrapper für asynchrone Node-Funktionen zur Verfügung
///
Object.defineProperty(exports, "__esModule", { value: true });
function promisify(fn, context) {
    return function (...args) {
        context = context || this;
        return new Promise((resolve, reject) => {
            fn.apply(context, [...args, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    else {
                        return resolve(result);
                    }
                }]);
        });
    };
}
exports.promisify = promisify;
function promisifyNoError(fn, context) {
    return function (...args) {
        context = context || this;
        return new Promise((resolve, reject) => {
            fn.apply(context, [...args, (result) => {
                    return resolve(result);
                }]);
        });
    };
}
exports.promisifyNoError = promisifyNoError;
function waterfall(...fn) {
    // Führt eine Reihe von Promises sequentiell aus
    // TODO: Rückgabewerte prüfen (ob da was zu viel ist)
    return fn.reduce((prev, cur) => prev.then(cur), Promise.resolve());
}
exports.waterfall = waterfall;
/** Creates a promise that waits for the specified time and then resolves */
function wait(ms) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
exports.wait = wait;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbWlzZXMuanMiLCJzb3VyY2VSb290IjoiRDovaW9Ccm9rZXIudHJhZGZyaS9zcmMvIiwic291cmNlcyI6WyJsaWIvcHJvbWlzZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLEdBQUc7QUFDSCw2RUFBNkU7QUFDN0UsR0FBRzs7QUFLSCxtQkFBMEIsRUFBRSxFQUFFLE9BQWE7SUFDMUMsTUFBTSxDQUFDLFVBQVMsR0FBRyxJQUFJO1FBQ3RCLE9BQU8sR0FBRyxPQUFPLElBQUksSUFBSSxDQUFDO1FBQzFCLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNO1lBQ2xDLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTTtvQkFDekMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQzt3QkFDWCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUN0QixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNQLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3hCLENBQUM7Z0JBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0gsQ0FBQztBQWJELDhCQWFDO0FBR0QsMEJBQWlDLEVBQUUsRUFBRSxPQUFhO0lBQ2pELE1BQU0sQ0FBQyxVQUFTLEdBQUcsSUFBSTtRQUN0QixPQUFPLEdBQUcsT0FBTyxJQUFJLElBQUksQ0FBQztRQUMxQixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTTtZQUNsQyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTTtvQkFDbEMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDeEIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0FBQ0gsQ0FBQztBQVRELDRDQVNDO0FBRUQsbUJBQTBCLEdBQUcsRUFBcUI7SUFDakQsZ0RBQWdEO0lBQ2hELHFEQUFxRDtJQUNyRCxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDZixDQUFDLElBQUksRUFBRSxHQUFHLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFDN0IsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUNqQixDQUFDO0FBQ0gsQ0FBQztBQVBELDhCQU9DO0FBRUQsNEVBQTRFO0FBQzVFLGNBQXFCLEVBQVU7SUFDOUIsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU07UUFDeEMsVUFBVSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUMsQ0FBQztBQUNKLENBQUM7QUFKRCxvQkFJQyJ9