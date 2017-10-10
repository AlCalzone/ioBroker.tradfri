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
const ipsoObject_1 = require("./ipsoObject");
// contains information about a specific device
class DeviceInfo extends ipsoObject_1.IPSOObject {
    constructor() {
        super(...arguments);
        this.firmwareVersion = "";
        this.manufacturer = "";
        this.modelNumber = "";
        this.power = 0;
        this.serialNumber = "";
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9"),
    __metadata("design:type", Number)
], DeviceInfo.prototype, "battery", void 0);
__decorate([
    ipsoObject_1.ipsoKey("3"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "firmwareVersion", void 0);
__decorate([
    ipsoObject_1.ipsoKey("0"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "manufacturer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("1"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "modelNumber", void 0);
__decorate([
    ipsoObject_1.ipsoKey("6"),
    __metadata("design:type", Number)
], DeviceInfo.prototype, "power", void 0);
__decorate([
    ipsoObject_1.ipsoKey("2"),
    __metadata("design:type", String)
], DeviceInfo.prototype, "serialNumber", void 0);
exports.DeviceInfo = DeviceInfo;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlSW5mby5qcyIsInNvdXJjZVJvb3QiOiJEOi9pb0Jyb2tlci50cmFkZnJpL3NyYy8iLCJzb3VyY2VzIjpbImlwc28vZGV2aWNlSW5mby50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBLDZDQUFnSDtBQUVoSCwrQ0FBK0M7QUFDL0MsZ0JBQXdCLFNBQVEsdUJBQVU7SUFBMUM7O1FBTVEsb0JBQWUsR0FBVyxFQUFFLENBQUM7UUFHN0IsaUJBQVksR0FBVyxFQUFFLENBQUM7UUFHMUIsZ0JBQVcsR0FBVyxFQUFFLENBQUM7UUFHekIsVUFBSyxHQUFXLENBQUMsQ0FBQztRQUdsQixpQkFBWSxHQUFXLEVBQUUsQ0FBQztJQUVsQyxDQUFDO0NBQUE7QUFqQkE7SUFEQyxvQkFBTyxDQUFDLEdBQUcsQ0FBQzs7MkNBQ1U7QUFHdkI7SUFEQyxvQkFBTyxDQUFDLEdBQUcsQ0FBQzs7bURBQ3VCO0FBR3BDO0lBREMsb0JBQU8sQ0FBQyxHQUFHLENBQUM7O2dEQUNvQjtBQUdqQztJQURDLG9CQUFPLENBQUMsR0FBRyxDQUFDOzsrQ0FDbUI7QUFHaEM7SUFEQyxvQkFBTyxDQUFDLEdBQUcsQ0FBQzs7eUNBQ1k7QUFHekI7SUFEQyxvQkFBTyxDQUFDLEdBQUcsQ0FBQzs7Z0RBQ29CO0FBbEJsQyxnQ0FvQkMifQ==