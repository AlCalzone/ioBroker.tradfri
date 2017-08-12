import IPSODevice from "./ipsoDevice";
import { PropertyDefinition } from "./ipsoObject";
export default class Notification extends IPSODevice {
    constructor(sourceObj: any, ...properties: PropertyDefinition[]);
}
