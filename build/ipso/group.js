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
const conversions_1 = require("../lib/conversions");
const ipsoDevice_1 = require("./ipsoDevice");
const ipsoObject_1 = require("./ipsoObject");
class Group extends ipsoDevice_1.IPSODevice {
    constructor() {
        super(...arguments);
        this.onOff = false; // <bool>
        this.dimmer = 0; // <int> [0..254]
        // The transition time is not reported by the gateway
        // but it accepts it for a state change
        this.transitionTime = 0; // <float>
    }
}
__decorate([
    ipsoObject_1.ipsoKey("5850"),
    __metadata("design:type", Boolean)
], Group.prototype, "onOff", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5851"),
    __metadata("design:type", Number)
], Group.prototype, "dimmer", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9039"),
    __metadata("design:type", Number)
], Group.prototype, "sceneId", void 0);
__decorate([
    ipsoObject_1.ipsoKey("9018"),
    ipsoObject_1.deserializeWith(obj => parseAccessoryLink(obj)),
    ipsoObject_1.serializeWith(ids => toAccessoryLink(ids), false),
    __metadata("design:type", Array)
], Group.prototype, "deviceIDs", void 0);
__decorate([
    ipsoObject_1.ipsoKey("5712"),
    ipsoObject_1.serializeWith(conversions_1.serializers.transitionTime),
    ipsoObject_1.deserializeWith(conversions_1.deserializers.transitionTime),
    __metadata("design:type", Number)
], Group.prototype, "transitionTime", void 0);
exports.Group = Group;
// TODO: Type annotation
function parseAccessoryLink(link) {
    const hsLink = link["15002"];
    const deviceIDs = hsLink["9003"];
    return deviceIDs;
}
function toAccessoryLink(ids) {
    return {
        15002: {
            9003: ids,
        },
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JvdXAuanMiLCJzb3VyY2VSb290IjoiRDovaW9Ccm9rZXIudHJhZGZyaS9zcmMvIiwic291cmNlcyI6WyJpcHNvL2dyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUEsb0RBQWdFO0FBQ2hFLDZDQUEwQztBQUMxQyw2Q0FBZ0g7QUFFaEgsV0FBbUIsU0FBUSx1QkFBVTtJQUFyQzs7UUFHUSxVQUFLLEdBQVksS0FBSyxDQUFDLENBQUMsU0FBUztRQUdqQyxXQUFNLEdBQVcsQ0FBQyxDQUFDLENBQUMsaUJBQWlCO1FBVTVDLHFEQUFxRDtRQUNyRCx1Q0FBdUM7UUFJaEMsbUJBQWMsR0FBVyxDQUFDLENBQUMsQ0FBQyxVQUFVO0lBRTlDLENBQUM7Q0FBQTtBQXBCQTtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOztvQ0FDYztBQUc5QjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOztxQ0FDVTtBQUcxQjtJQURDLG9CQUFPLENBQUMsTUFBTSxDQUFDOztzQ0FDTztBQUt2QjtJQUhDLG9CQUFPLENBQUMsTUFBTSxDQUFDO0lBQ2YsNEJBQWUsQ0FBQyxHQUFHLElBQUksa0JBQWtCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsMEJBQWEsQ0FBQyxHQUFHLElBQUksZUFBZSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQzs7d0NBQ3ZCO0FBTzNCO0lBSEMsb0JBQU8sQ0FBQyxNQUFNLENBQUM7SUFDZiwwQkFBYSxDQUFDLHlCQUFXLENBQUMsY0FBYyxDQUFDO0lBQ3pDLDRCQUFlLENBQUMsMkJBQWEsQ0FBQyxjQUFjLENBQUM7OzZDQUNaO0FBckJuQyxzQkF1QkM7QUFFRCx3QkFBd0I7QUFDeEIsNEJBQTRCLElBQUk7SUFDL0IsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNqQyxNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ2xCLENBQUM7QUFDRCx5QkFBeUIsR0FBYTtJQUNyQyxNQUFNLENBQUM7UUFDTixLQUFLLEVBQUU7WUFDTixJQUFJLEVBQUUsR0FBRztTQUNUO0tBQ0QsQ0FBQztBQUNILENBQUMifQ==