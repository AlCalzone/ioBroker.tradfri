import { DictionaryLike } from "../lib/object-polyfill";
export declare class IPSOObject {
    /**
     * Reads this instance's properties from the given object
     */
    parse(obj: DictionaryLike<any>): this;
    private parseValue(propKey, value, deserializers?, requiresArraySplitting?);
    /**
     * Overrides this object's properties with those from another partial one
     */
    merge(obj: Partial<this>): this;
    /** serializes this object in order to transfer it via COAP */
    serialize(reference?: any): DictionaryLike<any>;
    /**
     * Deeply clones an IPSO Object
     */
    clone(): this;
    private isSerializedObjectEmpty(obj);
}
export declare type PropertyTransform = (value: any, parent?: IPSOObject) => any;
/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
export declare const ipsoKey: (key: string) => PropertyDecorator;
/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
export declare function required(target: object, property: string | symbol): void;
/**
 * Defines the required transformations to serialize a property to a CoAP object
 * @param transform: The transformation to apply during serialization
 * @param splitArrays: Whether the serializer expects arrays to be split up in advance
 */
export declare const serializeWith: (transform: PropertyTransform, splitArrays?: boolean) => PropertyDecorator;
export declare const defaultSerializers: DictionaryLike<PropertyTransform>;
/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param transform: The transformation to apply during deserialization
 * @param splitArrays: Whether the deserializer expects arrays to be split up in advance
 */
export declare const deserializeWith: (transforms: PropertyTransform | PropertyTransform[], splitArrays?: boolean) => PropertyDecorator;
export declare const defaultDeserializers: DictionaryLike<PropertyTransform>;
