"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
class Notification extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.event = 0;
        this.details = {};
        this.state = 0; // => ?
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9015"),
    __metadata("design:type", Number)
], Notification.prototype, "event", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9017"),
    ipsoObject_1.deserializeWith(arr => parseNotificationDetails(arr), false /* parse whole arrays */),
    __metadata("design:type", Object)
], Notification.prototype, "details", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9014"),
    __metadata("design:type", Number)
], Notification.prototype, "state", void 0);
exports.Notification = Notification;
var NotificationTypes;
(function (NotificationTypes) {
    NotificationTypes[NotificationTypes["NEW_FIRMWARE_AVAILABLE"] = 1001] = "NEW_FIRMWARE_AVAILABLE";
    NotificationTypes[NotificationTypes["GATEWAY_REBOOT_NOTIFICATION"] = 1003] = "GATEWAY_REBOOT_NOTIFICATION";
    NotificationTypes[NotificationTypes["UNKNOWN1"] = 1004] = "UNKNOWN1";
    NotificationTypes[NotificationTypes["UNKNOWN2"] = 1005] = "UNKNOWN2";
    NotificationTypes[NotificationTypes["LOSS_OF_INTERNET_CONNECTIVITY"] = 5001] = "LOSS_OF_INTERNET_CONNECTIVITY";
})(NotificationTypes = exports.NotificationTypes || (exports.NotificationTypes = {}));
/**
 * Turns a key=value-Array into a Dictionary object
 */
function parseNotificationDetails(kvpList) {
    const ret = {};
    for (const kvp of kvpList) {
        const parts = kvp.split("=");
        ret[parts[0]] = parts[1];
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9uLmpzIiwic291cmNlUm9vdCI6IkQ6L2lvQnJva2VyLnRyYWRmcmkvc3JjLyIsInNvdXJjZXMiOlsiaXBzby9ub3RpZmljYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBMEM7QUFDMUMsNkNBQWdIO0FBRWhILGtCQUEwQixTQUFRLHVCQUFVO0lBQTVDOztRQUdRLFVBQUssR0FBc0IsQ0FBQyxDQUFDO1FBSTdCLFlBQU8sR0FBMkIsRUFBRSxDQUFDO1FBR3JDLFVBQUssR0FBVyxDQUFDLENBQUMsQ0FBQyxPQUFPO0lBRWxDLENBQUM7Q0FBQTtBQVRBO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7OzJDQUNvQjtBQUlwQztJQUZDLG9CQUFPLENBQUMsTUFBTSxDQUFDO0lBQ2YsNEJBQWUsQ0FBQyxHQUFHLElBQUksd0JBQXdCLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLHdCQUF3QixDQUFDOzs2Q0FDMUM7QUFHNUM7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7MkNBQ1M7QUFWMUIsb0NBWUM7QUFFRCxJQUFZLGlCQU1YO0FBTkQsV0FBWSxpQkFBaUI7SUFDNUIsZ0dBQTZCLENBQUE7SUFDN0IsMEdBQWtDLENBQUE7SUFDbEMsb0VBQWUsQ0FBQTtJQUNmLG9FQUFlLENBQUE7SUFDZiw4R0FBb0MsQ0FBQTtBQUNyQyxDQUFDLEVBTlcsaUJBQWlCLEdBQWpCLHlCQUFpQixLQUFqQix5QkFBaUIsUUFNNUI7QUFFRDs7R0FFRztBQUNILGtDQUFrQyxPQUFpQjtJQUNsRCxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDZixHQUFHLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzNCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBQ0QsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUNaLENBQUMifQ==