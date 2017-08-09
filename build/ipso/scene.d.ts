import IPSODevice from "./ipsoDevice";
import { PropertyDefinition } from "./ipsoObject";
export default class Scene extends IPSODevice {
    constructor(sourceObj: any, ...properties: PropertyDefinition[]);
}
