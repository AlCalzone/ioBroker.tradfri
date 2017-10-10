"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createDeferredPromise() {
    let res;
    let rej;
    const promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });
    promise.resolve = res;
    promise.reject = rej;
    return promise;
}
exports.createDeferredPromise = createDeferredPromise;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXItcHJvbWlzZS5qcyIsInNvdXJjZVJvb3QiOiJEOi9pb0Jyb2tlci50cmFkZnJpL3NyYy8iLCJzb3VyY2VzIjpbImxpYi9kZWZlci1wcm9taXNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBS0E7SUFDQyxJQUFJLEdBQXlDLENBQUM7SUFDOUMsSUFBSSxHQUEyQixDQUFDO0lBRWhDLE1BQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFJLENBQUMsT0FBTyxFQUFFLE1BQU07UUFDOUMsR0FBRyxHQUFHLE9BQU8sQ0FBQztRQUNkLEdBQUcsR0FBRyxNQUFNLENBQUM7SUFDZCxDQUFDLENBQXVCLENBQUM7SUFFekIsT0FBTyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUM7SUFDdEIsT0FBTyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7SUFFckIsTUFBTSxDQUFDLE9BQU8sQ0FBQztBQUNoQixDQUFDO0FBYkQsc0RBYUMifQ==