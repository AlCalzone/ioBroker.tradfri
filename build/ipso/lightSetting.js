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
class LightSetting extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.color = "f1e0b5"; // hex string
        this.UNKNOWN1 = 0; // ???
        this.UNKNOWN2 = 0; // ???
        this.colorX = 0; // int
        this.colorY = 0; // int
        this.UNKNOWN3 = 0; // ???
        this.dimmer = 0; // <int> [0..254]
        this.onOff = false; // <bool>
    }
}
__decorate([
    ipsoObject_1.ipsoKey("5706"),
    __metadata("design:type", String)
], LightSetting.prototype, "color", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5707"),
    __metadata("design:type", Number)
], LightSetting.prototype, "UNKNOWN1", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5708"),
    __metadata("design:type", Number)
], LightSetting.prototype, "UNKNOWN2", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5709"),
    __metadata("design:type", Number)
], LightSetting.prototype, "colorX", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5710"),
    __metadata("design:type", Number)
], LightSetting.prototype, "colorY", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5711"),
    __metadata("design:type", Number)
], LightSetting.prototype, "UNKNOWN3", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    __metadata("design:type", Number)
], LightSetting.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], LightSetting.prototype, "onOff", void 0);
exports.LightSetting = LightSetting;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlnaHRTZXR0aW5nLmpzIiwic291cmNlUm9vdCI6IkQ6L2lvQnJva2VyLnRyYWRmcmkvc3JjLyIsInNvdXJjZXMiOlsiaXBzby9saWdodFNldHRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBMEM7QUFDMUMsNkNBQWdIO0FBRWhILGtCQUEwQixTQUFRLHVCQUFVO0lBQTVDOztRQUdRLFVBQUssR0FBVyxRQUFRLENBQUMsQ0FBQyxhQUFhO1FBR3ZDLGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBRTVCLGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBRzVCLFdBQU0sR0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBRTFCLFdBQU0sR0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBRzFCLGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNO1FBRzVCLFdBQU0sR0FBVyxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7UUFHckMsVUFBSyxHQUFZLEtBQUssQ0FBQyxDQUFDLFNBQVM7SUFFekMsQ0FBQztDQUFBO0FBckJBO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7OzJDQUNnQjtBQUdoQztJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzs4Q0FDWTtBQUU1QjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzs4Q0FDWTtBQUc1QjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzs0Q0FDVTtBQUUxQjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzs0Q0FDVTtBQUcxQjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzs4Q0FDWTtBQUc1QjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzs0Q0FDVTtBQUcxQjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzsyQ0FDYztBQXRCL0Isb0NBd0JDIn0=