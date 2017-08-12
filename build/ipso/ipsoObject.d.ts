export declare type PropertyDefinition = [string, string, any];
export declare class IPSOObject {
    constructor(sourceObj: any, ...properties: PropertyDefinition[]);
    /** lookup dictionary for propName => key */
    private keys;
    /** lookup dictionary for key => propName */
    private propNames;
    /** lookup dictionary for key => default property value */
    private defaultValues;
    /** lookup dictionary for key => property parser */
    private parsers;
    protected defineProperties(properties: PropertyDefinition[]): void;
    private getParser(key);
    private deserialize(obj);
    private parseValue(propKey, value, parser?);
    getKey(propName: any): string;
    getPropName(key: any): string;
    serialize(reference?: any): {};
}
