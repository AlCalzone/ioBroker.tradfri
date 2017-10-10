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
/** contains information about the gateway */
class GatewayDetails extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.ntpServerUrl = "";
        this.version = "";
        this.updateState = 0; // => which enum?
        this.updateProgress = 100; // <int>
        this.updateDetailsURL = ""; // <string> => what is this?
        this.currentTimestamp = 0; // <long>
        this.UNKNOWN1 = ""; // <string> => something to do with commissioning? XML-Date
        this.commissioningMode = 0; // <int> => which enum?
        this.UNKNOWN2 = 0; // <int> => something more with commissioning?
        this.updatePriority = updatePriority.normal;
        this.updateAcceptedTimestamp = 0; // <int>
        this.timeSource = -1; // <int>
        this.UNKNOWN3 = 0; // <int/bool> => what is this?
        this.UNKNOWN4 = 0; // <int/bool> => what is this?
        this.UNKNOWN5 = 0; // <int/bool> => what is this?
        this.UNKNOWN6 = 0; // <int/bool> => what is this?
        this.UNKNOWN7 = 0; // <int/bool> => what is this?
        this.UNKNOWN8 = 0; // <int/bool> => what is this?
        this.UNKNOWN9 = 0; // <int/bool> => what is this?
        this.UNKNOWN10 = 0; // <int/bool> => what is this?
        this.UNKNOWN11 = 0; // <int/bool> => what is this?
        this.UNKNOWN12 = ""; // some kind of hex code
        // are those used?
        this.FORCE_CHECK_OTA_UPDATE = "";
        this.name = "";
    }
}
__decorate([
    ipsoObject_1.ipsoKey("9023"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "ntpServerUrl", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9029"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "version", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9054"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateState", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9055"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateProgress", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9056"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "updateDetailsURL", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9059"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "currentTimestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9060"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "UNKNOWN1", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9061"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "commissioningMode", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9062"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN2", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9066"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updatePriority", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9069"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "updateAcceptedTimestamp", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9071"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "timeSource", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9072"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN3", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9073"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN4", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9074"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN5", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9075"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN6", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9076"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN7", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9077"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN8", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9078"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN9", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9079"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN10", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9080"),
    __metadata("design:type", Number)
], GatewayDetails.prototype, "UNKNOWN11", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9081"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "UNKNOWN12", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9032"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "FORCE_CHECK_OTA_UPDATE", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9035"),
    __metadata("design:type", String)
], GatewayDetails.prototype, "name", void 0);
exports.GatewayDetails = GatewayDetails;
var updatePriority;
(function (updatePriority) {
    updatePriority[updatePriority["normal"] = 0] = "normal";
    updatePriority[updatePriority["critical"] = 1] = "critical";
    updatePriority[updatePriority["required"] = 2] = "required";
    updatePriority[updatePriority["forced"] = 5] = "forced";
})(updatePriority = exports.updatePriority || (exports.updatePriority = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2F0ZXdheURldGFpbHMuanMiLCJzb3VyY2VSb290IjoiRDovaW9Ccm9rZXIudHJhZGZyaS9zcmMvIiwic291cmNlcyI6WyJpcHNvL2dhdGV3YXlEZXRhaWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsNkNBQTBDO0FBQzFDLDZDQUFnSDtBQUVoSCw2Q0FBNkM7QUFDN0Msb0JBQTRCLFNBQVEsdUJBQVU7SUFBOUM7O1FBR1EsaUJBQVksR0FBVyxFQUFFLENBQUM7UUFHMUIsWUFBTyxHQUFXLEVBQUUsQ0FBQztRQUdyQixnQkFBVyxHQUFXLENBQUMsQ0FBQyxDQUFDLGlCQUFpQjtRQUcxQyxtQkFBYyxHQUFXLEdBQUcsQ0FBQyxDQUFFLFFBQVE7UUFHdkMscUJBQWdCLEdBQVcsRUFBRSxDQUFDLENBQUMsNEJBQTRCO1FBRzNELHFCQUFnQixHQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVM7UUFHdkMsYUFBUSxHQUFXLEVBQUUsQ0FBQyxDQUFDLDJEQUEyRDtRQUdsRixzQkFBaUIsR0FBVyxDQUFDLENBQUMsQ0FBQyx1QkFBdUI7UUFHdEQsYUFBUSxHQUFXLENBQUMsQ0FBQyxDQUFDLDhDQUE4QztRQUdwRSxtQkFBYyxHQUFtQixjQUFjLENBQUMsTUFBTSxDQUFDO1FBR3ZELDRCQUF1QixHQUFXLENBQUMsQ0FBQyxDQUFDLFFBQVE7UUFHN0MsZUFBVSxHQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUTtRQUdqQyxhQUFRLEdBQVcsQ0FBQyxDQUFDLENBQUMsOEJBQThCO1FBRXBELGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7UUFFcEQsYUFBUSxHQUFXLENBQUMsQ0FBQyxDQUFDLDhCQUE4QjtRQUVwRCxhQUFRLEdBQVcsQ0FBQyxDQUFDLENBQUMsOEJBQThCO1FBRXBELGFBQVEsR0FBVyxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7UUFFcEQsYUFBUSxHQUFXLENBQUMsQ0FBQyxDQUFDLDhCQUE4QjtRQUVwRCxhQUFRLEdBQVcsQ0FBQyxDQUFDLENBQUMsOEJBQThCO1FBRXBELGNBQVMsR0FBVyxDQUFDLENBQUMsQ0FBQyw4QkFBOEI7UUFFckQsY0FBUyxHQUFXLENBQUMsQ0FBQyxDQUFDLDhCQUE4QjtRQUVyRCxjQUFTLEdBQVcsRUFBRSxDQUFDLENBQUMsd0JBQXdCO1FBRXZELGtCQUFrQjtRQUVYLDJCQUFzQixHQUFXLEVBQUUsQ0FBQztRQUVwQyxTQUFJLEdBQVcsRUFBRSxDQUFDO0lBRTFCLENBQUM7Q0FBQTtBQTlEQTtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOztvREFDaUI7QUFHakM7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7K0NBQ1k7QUFHNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7bURBQ2U7QUFHL0I7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7c0RBQ29CO0FBR3BDO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7O3dEQUNxQjtBQUdyQztJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzt3REFDb0I7QUFHcEM7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ2E7QUFHN0I7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7eURBQ3FCO0FBR3JDO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7O2dEQUNZO0FBRzVCO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7O3NEQUM4QztBQUc5RDtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOzsrREFDMkI7QUFHM0M7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7a0RBQ2U7QUFHL0I7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7Z0RBQ1k7QUFFNUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7aURBQ2E7QUFFN0I7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7aURBQ2E7QUFFN0I7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7aURBQ2M7QUFJOUI7SUFEQyxvQkFBTyxDQUFDLE1BQU0sQ0FBQzs7OERBQzJCO0FBRTNDO0lBREMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7OzRDQUNTO0FBL0QxQix3Q0FpRUM7QUFFRCxJQUFZLGNBS1g7QUFMRCxXQUFZLGNBQWM7SUFDekIsdURBQVUsQ0FBQTtJQUNWLDJEQUFZLENBQUE7SUFDWiwyREFBWSxDQUFBO0lBQ1osdURBQVUsQ0FBQTtBQUNYLENBQUMsRUFMVyxjQUFjLEdBQWQsc0JBQWMsS0FBZCxzQkFBYyxRQUt6QiJ9