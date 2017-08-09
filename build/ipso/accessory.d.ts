import IPSODevice from "./ipsoDevice";
import { PropertyDefinition } from "./ipsoObject";
export default class Accessory extends IPSODevice {
    constructor(sourceObj: any, ...properties: PropertyDefinition[]);
}
