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
const deviceInfo_1 = require("./deviceInfo");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
const light_1 = require("./light");
// list of known endpoints defined on the gateway
var AccessoryTypes;
(function (AccessoryTypes) {
    AccessoryTypes[AccessoryTypes["remote"] = 0] = "remote";
    AccessoryTypes[AccessoryTypes["lightbulb"] = 2] = "lightbulb";
    // TODO: find out the other ones
})(AccessoryTypes = exports.AccessoryTypes || (exports.AccessoryTypes = {}));
class Accessory extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.type = AccessoryTypes.remote;
        this.deviceInfo = null;
        this.alive = false;
        this.lastSeen = 0;
        this.otaUpdateState = 0; // boolean?
    }
}
__decorate([
    ipsoObject_1.ipsoKey("5750"),
    __metadata("design:type", Number)
], Accessory.prototype, "type", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3"),
    ipsoObject_1.deserializeWith(obj => new deviceInfo_1.DeviceInfo().parse(obj)),
    __metadata("design:type", deviceInfo_1.DeviceInfo)
], Accessory.prototype, "deviceInfo", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9019"),
    __metadata("design:type", Boolean)
], Accessory.prototype, "alive", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9020"),
    __metadata("design:type", Number)
], Accessory.prototype, "lastSeen", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3311"),
    ipsoObject_1.deserializeWith(obj => new light_1.Light().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "lightList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3312"),
    ipsoObject_1.deserializeWith(obj => new ipsoDevice_1.IPSODevice().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "plugList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3300"),
    ipsoObject_1.deserializeWith(obj => new ipsoDevice_1.IPSODevice().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "sensorList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("15009"),
    ipsoObject_1.deserializeWith(obj => new ipsoDevice_1.IPSODevice().parse(obj)),
    __metadata("design:type", Array)
], Accessory.prototype, "switchList", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], Accessory.prototype, "otaUpdateState", void 0);
exports.Accessory = Accessory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXNzb3J5LmpzIiwic291cmNlUm9vdCI6IkQ6L2lvQnJva2VyLnRyYWRmcmkvc3JjLyIsInNvdXJjZXMiOlsiaXBzby9hY2Nlc3NvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBMEM7QUFDMUMsNkNBQTBDO0FBQzFDLDZDQUFnSDtBQUNoSCxtQ0FBZ0M7QUFFaEMsaURBQWlEO0FBQ2pELElBQVksY0FJWDtBQUpELFdBQVksY0FBYztJQUN6Qix1REFBVSxDQUFBO0lBQ1YsNkRBQWEsQ0FBQTtJQUNiLGdDQUFnQztBQUNqQyxDQUFDLEVBSlcsY0FBYyxHQUFkLHNCQUFjLEtBQWQsc0JBQWMsUUFJekI7QUFFRCxlQUF1QixTQUFRLHVCQUFVO0lBQXpDOztRQUdRLFNBQUksR0FBbUIsY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUk3QyxlQUFVLEdBQWUsSUFBSSxDQUFDO1FBRzlCLFVBQUssR0FBWSxLQUFLLENBQUM7UUFHdkIsYUFBUSxHQUFXLENBQUMsQ0FBQztRQW1CckIsbUJBQWMsR0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXO0lBRS9DLENBQUM7Q0FBQTtBQS9CQTtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzt1Q0FDb0M7QUFJcEQ7SUFGQyxvQkFBTyxDQUFDLEdBQUcsQ0FBQztJQUNaLDRCQUFlLENBQUMsR0FBRyxJQUFJLElBQUksdUJBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs4QkFDakMsdUJBQVU7NkNBQVE7QUFHckM7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7d0NBQ2M7QUFHOUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7MkNBQ1k7QUFJNUI7SUFGQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQztJQUNmLDRCQUFlLENBQUMsR0FBRyxJQUFJLElBQUksYUFBSyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs0Q0FDckI7QUFJMUI7SUFGQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQztJQUNmLDRCQUFlLENBQUMsR0FBRyxJQUFJLElBQUksdUJBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs7MkNBQ3RCO0FBSTlCO0lBRkMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7SUFDZiw0QkFBZSxDQUFDLEdBQUcsSUFBSSxJQUFJLHVCQUFVLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7OzZDQUNwQjtBQUloQztJQUZDLG9CQUFPLENBQUMsT0FBTyxDQUFDO0lBQ2hCLDRCQUFlLENBQUMsR0FBRyxJQUFJLElBQUksdUJBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzs7NkNBQ3BCO0FBR2hDO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7O2lEQUNrQjtBQWhDbkMsOEJBa0NDIn0=