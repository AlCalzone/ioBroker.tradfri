import IPSODevice from "./ipsoDevice";
import { PropertyDefinition } from "./ipsoObject";
export default class Group extends IPSODevice {
    constructor(sourceObj: any, ...properties: PropertyDefinition[]);
}
