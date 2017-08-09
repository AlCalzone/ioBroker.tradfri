import IPSODevice from "./ipsoDevice";
import { PropertyDefinition } from "./ipsoObject";
/** contains information about the gateway */
export default class GatewayDetails extends IPSODevice {
    constructor(sourceObj: any, ...properties: PropertyDefinition[]);
}
