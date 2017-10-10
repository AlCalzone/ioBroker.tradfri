"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../lib/global");
const object_polyfill_1 = require("../lib/object-polyfill");
// common base class for all objects that are transmitted somehow
class IPSOObject {
    /**
     * Reads this instance's properties from the given object
     */
    parse(obj) {
        for (const [key, value] of object_polyfill_1.entries(obj)) {
            // key might be ipso key or property name
            let deserializer = getDeserializer(this, key);
            let requiresArraySplitting = deserializerRequiresArraySplitting(this, key);
            let propName;
            if (deserializer == null) {
                // deserializers are defined by property name, so key is actually the key
                propName = lookupKeyOrProperty(this, key);
                if (!propName) {
                    global_1.Global.log(`{{yellow}}found unknown property with key ${key}`);
                    continue;
                }
                deserializer = getDeserializer(this, propName);
                requiresArraySplitting = deserializerRequiresArraySplitting(this, propName);
            }
            else {
                // the deserializer was found, so key is actually the property name
                propName = key;
            }
            // parse the value
            const parsedValue = this.parseValue(key, value, deserializer, requiresArraySplitting);
            // and remember it
            this[propName] = parsedValue;
        }
        return this;
    }
    // parses a value, depending on the value type and defined parsers
    parseValue(propKey, value, deserializer, requiresArraySplitting = true) {
        if (value instanceof Array && requiresArraySplitting) {
            // Array: parse every element
            return value.map(v => this.parseValue(propKey, v, deserializer, requiresArraySplitting));
        }
        else if (typeof value === "object") {
            // Object: try to parse this, objects should be parsed in any case
            if (deserializer) {
                return deserializer(value);
            }
            else {
                global_1.Global.log(`{{yellow}}could not find deserializer for key ${propKey}`);
            }
        }
        else if (deserializer) {
            // if this property needs a parser, parse the value
            return deserializer(value);
        }
        else {
            // otherwise just return the value
            return value;
        }
    }
    /**
     * Overrides this object's properties with those from another partial one
     */
    merge(obj) {
        for (const [key, value] of object_polyfill_1.entries(obj)) {
            if (this.hasOwnProperty(key)) {
                this[key] = value;
            }
        }
        return this;
    }
    /** serializes this object in order to transfer it via COAP */
    serialize(reference = null) {
        const ret = {};
        const serializeValue = (key, propName, value, refValue, transform) => {
            const _required = isRequired(this, propName);
            let _ret = value;
            if (value instanceof IPSOObject) {
                // if the value is another IPSOObject, then serialize that
                _ret = value.serialize(refValue);
                // if the serialized object contains no required properties, don't remember it
                if (value.isSerializedObjectEmpty(_ret))
                    return null;
            }
            else {
                // if the value is not the default one, then remember it
                if (global_1.Global.isdef(refValue)) {
                    if (!_required && refValue === value)
                        return null;
                }
                else {
                    // there is no default value, just remember the actual value
                }
            }
            if (transform)
                _ret = transform(_ret);
            return _ret;
        };
        // const refObj = reference || getDefaultValues(this); //this.defaultValues;
        // check all set properties
        for (const propName of Object.keys(this)) {
            if (this.hasOwnProperty(propName)) {
                // find IPSO key
                const key = lookupKeyOrProperty(this, propName);
                // find value and reference (default) value
                let value = this[propName];
                let refValue = null;
                if (global_1.Global.isdef(reference) && reference.hasOwnProperty(propName)) {
                    refValue = reference[propName];
                }
                // try to find serializer for this property
                const serializer = getSerializer(this, propName);
                const requiresArraySplitting = serializerRequiresArraySplitting(this, propName);
                if (value instanceof Array && requiresArraySplitting) {
                    // serialize each item
                    if (global_1.Global.isdef(refValue)) {
                        // reference value exists, make sure we have the same amount of items
                        if (!(refValue instanceof Array && refValue.length === value.length)) {
                            throw new Error("cannot serialize arrays when the reference values don't match");
                        }
                        // serialize each item with the matching reference value
                        value = value.map((v, i) => serializeValue(key, propName, v, refValue[i], serializer));
                    }
                    else {
                        // no reference value, makes things easier
                        value = value.map(v => serializeValue(key, propName, v, null, serializer));
                    }
                    // now remove null items
                    value = value.filter(v => global_1.Global.isdef(v));
                    if (value.length === 0)
                        value = null;
                }
                else {
                    // directly serialize the value
                    value = serializeValue(key, propName, value, refValue, serializer);
                }
                // only output the value if it's != null
                if (value != null)
                    ret[key] = value;
            }
        }
        return ret;
    }
    /**
     * Deeply clones an IPSO Object
     */
    clone() {
        const constructor = this.constructor;
        const ret = new constructor();
        // serialize the old values
        const serialized = this.serialize();
        // and parse them back
        return ret.parse(serialized);
    }
    isSerializedObjectEmpty(obj) {
        // Prüfen, ob eine nicht-benötigte Eigenschaft angegeben ist. => nicht leer
        for (const key of Object.keys(obj)) {
            const propName = lookupKeyOrProperty(this, key);
            if (!isRequired(this, propName)) {
                return false;
            }
        }
        return true;
    }
}
exports.IPSOObject = IPSOObject;
// ===========================================================
// define decorators so we can define all properties type-safe
// tslint:disable:variable-name
const METADATA_ipsoKey = Symbol("ipsoKey");
const METADATA_required = Symbol("required");
const METADATA_serializeWith = Symbol("serializeWith");
const METADATA_deserializeWith = Symbol("deserializeWith");
/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
exports.ipsoKey = (key) => {
    return (target, property) => {
        // get the class constructor
        const constr = target.constructor;
        // retrieve the current metadata
        const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
        // and enhance it (both ways)
        metadata[property] = key;
        metadata[key] = property;
        // store back to the object
        Reflect.defineMetadata(METADATA_ipsoKey, metadata, constr);
    };
};
/**
 * Looks up previously stored property ipso key definitions.
 * Returns a property name if the key was given, or the key if a property name was given.
 * @param keyOrProperty - ipso key or property name to lookup
 */
function lookupKeyOrProperty(target, keyOrProperty) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
    if (metadata.hasOwnProperty(keyOrProperty))
        return metadata[keyOrProperty];
    return null;
}
/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
function required(target, property) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
    // and enhance it (both ways)
    metadata[property] = true;
    // store back to the object
    Reflect.defineMetadata(METADATA_required, metadata, constr);
}
exports.required = required;
/**
 * Checks if a property is required to be present in a serialized CoAP object
 * @param property - property name to lookup
 */
function isRequired(target, property) {
    // get the class constructor
    const constr = target.constructor;
    global_1.Global.log(`${constr.name}: checking if ${property} is required...`, "silly");
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
    if (metadata.hasOwnProperty(property))
        return metadata[property];
    return false;
}
/**
 * Defines the required transformations to serialize a property to a CoAP object
 * @param transform: The transformation to apply during serialization
 * @param splitArrays: Whether the serializer expects arrays to be split up in advance
 */
exports.serializeWith = (transform, splitArrays = true) => {
    return (target, property) => {
        // get the class constructor
        const constr = target.constructor;
        // retrieve the current metadata
        const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
        metadata[property] = { transform, splitArrays };
        // store back to the object
        Reflect.defineMetadata(METADATA_serializeWith, metadata, constr);
    };
};
// tslint:disable:object-literal-key-quotes
exports.defaultSerializers = {
    "Boolean": (bool) => bool ? 1 : 0,
};
// tslint:enable:object-literal-key-quotes
/**
 * Retrieves the serializer for a given property
 */
function getSerializer(target, property) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
    if (metadata.hasOwnProperty(property))
        return metadata[property].transform;
    // If there's no custom serializer, try to find a default one
    const type = getPropertyType(target, property);
    if (type && type.name in exports.defaultSerializers) {
        return exports.defaultSerializers[type.name];
    }
}
/**
 * Checks if the deserializer for a given property expects arrays to be split in advance
 */
function serializerRequiresArraySplitting(target, property) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
    if (metadata.hasOwnProperty(property)) {
        return metadata[property].splitArrays;
    }
    // return default value => true
    return true;
}
/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param transform: The transformation to apply during deserialization
 * @param splitArrays: Whether the deserializer expects arrays to be split up in advance
 */
exports.deserializeWith = (transform, splitArrays = true) => {
    return (target, property) => {
        // get the class constructor
        const constr = target.constructor;
        // retrieve the current metadata
        const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};
        metadata[property] = { transform, splitArrays };
        // store back to the object
        Reflect.defineMetadata(METADATA_deserializeWith, metadata, constr);
    };
};
// tslint:disable:object-literal-key-quotes
exports.defaultDeserializers = {
    "Boolean": (raw) => raw === 1 || raw === "true" || raw === "on" || raw === true,
};
// tslint:enable:object-literal-key-quotes
/**
 * Retrieves the deserializer for a given property
 */
function getDeserializer(target, property) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};
    if (metadata.hasOwnProperty(property)) {
        return metadata[property].transform;
    }
    // If there's no custom deserializer, try to find a default one
    const type = getPropertyType(target, property);
    if (type && type.name in exports.defaultDeserializers) {
        return exports.defaultDeserializers[type.name];
    }
}
/**
 * Checks if the deserializer for a given property expects arrays to be split in advance
 */
function deserializerRequiresArraySplitting(target, property) {
    // get the class constructor
    const constr = target.constructor;
    // retrieve the current metadata
    const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};
    if (metadata.hasOwnProperty(property)) {
        return metadata[property].splitArrays;
    }
    // return default value => true
    return true;
}
/**
 * Finds the design type for a given property
 */
// tslint:disable-next-line:ban-types
function getPropertyType(target, property) {
    return Reflect.getMetadata("design:type", target, property);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXBzb09iamVjdC5qcyIsInNvdXJjZVJvb3QiOiJEOi9pb0Jyb2tlci50cmFkZnJpL3NyYy8iLCJzb3VyY2VzIjpbImlwc28vaXBzb09iamVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDBDQUE0QztBQUM1Qyw0REFBd0Y7QUFFeEYsaUVBQWlFO0FBQ2pFO0lBRUM7O09BRUc7SUFDSSxLQUFLLENBQUMsR0FBd0I7UUFDcEMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSx5QkFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6Qyx5Q0FBeUM7WUFDekMsSUFBSSxZQUFZLEdBQXNCLGVBQWUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDakUsSUFBSSxzQkFBc0IsR0FBWSxrQ0FBa0MsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDcEYsSUFBSSxRQUF5QixDQUFDO1lBQzlCLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUMxQix5RUFBeUU7Z0JBQ3pFLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQzFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztvQkFDZixlQUFDLENBQUMsR0FBRyxDQUFDLDZDQUE2QyxHQUFHLEVBQUUsQ0FBQyxDQUFDO29CQUMxRCxRQUFRLENBQUM7Z0JBQ1YsQ0FBQztnQkFDRCxZQUFZLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDL0Msc0JBQXNCLEdBQUcsa0NBQWtDLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQzdFLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDUCxtRUFBbUU7Z0JBQ25FLFFBQVEsR0FBRyxHQUFHLENBQUM7WUFDaEIsQ0FBQztZQUNELGtCQUFrQjtZQUNsQixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixDQUFDLENBQUM7WUFDdEYsa0JBQWtCO1lBQ2xCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxXQUFXLENBQUM7UUFDOUIsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDO0lBRUQsa0VBQWtFO0lBQzFELFVBQVUsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFlBQWdDLEVBQUUseUJBQWtDLElBQUk7UUFDMUcsRUFBRSxDQUFDLENBQUMsS0FBSyxZQUFZLEtBQUssSUFBSSxzQkFBc0IsQ0FBQyxDQUFDLENBQUM7WUFDdEQsNkJBQTZCO1lBQzdCLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQztRQUMxRixDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE9BQU8sS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEMsa0VBQWtFO1lBQ2xFLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLE1BQU0sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDNUIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNQLGVBQUMsQ0FBQyxHQUFHLENBQUMsaURBQWlELE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDbkUsQ0FBQztRQUNGLENBQUM7UUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN6QixtREFBbUQ7WUFDbkQsTUFBTSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM1QixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxrQ0FBa0M7WUFDbEMsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUNkLENBQUM7SUFDRixDQUFDO0lBRUQ7O09BRUc7SUFDSSxLQUFLLENBQUMsR0FBa0I7UUFDOUIsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSx5QkFBTyxDQUFDLEdBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDbkIsQ0FBQztRQUNGLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELDhEQUE4RDtJQUN2RCxTQUFTLENBQUMsU0FBUyxHQUFHLElBQUk7UUFDaEMsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBRWYsTUFBTSxjQUFjLEdBQUcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsU0FBNkI7WUFDcEYsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM3QyxJQUFJLElBQUksR0FBRyxLQUFLLENBQUM7WUFDakIsRUFBRSxDQUFDLENBQUMsS0FBSyxZQUFZLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLDBEQUEwRDtnQkFDMUQsSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ2pDLDhFQUE4RTtnQkFDOUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxDQUFDO29CQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7WUFDdEQsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNQLHdEQUF3RDtnQkFDeEQsRUFBRSxDQUFDLENBQUMsZUFBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3ZCLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLFFBQVEsS0FBSyxLQUFLLENBQUM7d0JBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztnQkFDbkQsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDUCw0REFBNEQ7Z0JBQzdELENBQUM7WUFDRixDQUFDO1lBQ0QsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDO2dCQUFDLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUNiLENBQUMsQ0FBQztRQUVGLDRFQUE0RTtRQUM1RSwyQkFBMkI7UUFDM0IsR0FBRyxDQUFDLENBQUMsTUFBTSxRQUFRLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25DLGdCQUFnQjtnQkFDaEIsTUFBTSxHQUFHLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNoRCwyQ0FBMkM7Z0JBQzNDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixFQUFFLENBQUMsQ0FBQyxlQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUM5RCxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDO2dCQUVELDJDQUEyQztnQkFDM0MsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDakQsTUFBTSxzQkFBc0IsR0FBWSxnQ0FBZ0MsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7Z0JBRXpGLEVBQUUsQ0FBQyxDQUFDLEtBQUssWUFBWSxLQUFLLElBQUksc0JBQXNCLENBQUMsQ0FBQyxDQUFDO29CQUN0RCxzQkFBc0I7b0JBQ3RCLEVBQUUsQ0FBQyxDQUFDLGVBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN2QixxRUFBcUU7d0JBQ3JFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLFlBQVksS0FBSyxJQUFJLFFBQVEsQ0FBQyxNQUFNLEtBQUssS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDdEUsTUFBTSxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDO3dCQUNsRixDQUFDO3dCQUNELHdEQUF3RDt3QkFDeEQsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLGNBQWMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDeEYsQ0FBQztvQkFBQyxJQUFJLENBQUMsQ0FBQzt3QkFDUCwwQ0FBMEM7d0JBQzFDLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxjQUFjLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQzVFLENBQUM7b0JBQ0Qsd0JBQXdCO29CQUN4QixLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksZUFBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0QyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQzt3QkFBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO2dCQUN0QyxDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNQLCtCQUErQjtvQkFDL0IsS0FBSyxHQUFHLGNBQWMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3BFLENBQUM7Z0JBRUQsd0NBQXdDO2dCQUN4QyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO29CQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDckMsQ0FBQztRQUNGLENBQUM7UUFFRCxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQ1osQ0FBQztJQUVEOztPQUVHO0lBQ0ksS0FBSztRQUtYLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxXQUFrQyxDQUFDO1FBQzVELE1BQU0sR0FBRyxHQUFHLElBQUksV0FBVyxFQUFFLENBQUM7UUFDOUIsMkJBQTJCO1FBQzNCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNwQyxzQkFBc0I7UUFDdEIsTUFBTSxDQUFFLEdBQWtCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBUyxDQUFDO0lBQ3RELENBQUM7SUFFTyx1QkFBdUIsQ0FBQyxHQUF3QjtRQUN2RCwyRUFBMkU7UUFDM0UsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxRQUFRLEdBQUcsbUJBQW1CLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDZCxDQUFDO1FBQ0YsQ0FBQztRQUNELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDYixDQUFDO0NBRUQ7QUFsS0QsZ0NBa0tDO0FBRUQsOERBQThEO0FBQzlELDhEQUE4RDtBQUM5RCwrQkFBK0I7QUFDL0IsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDM0MsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDN0MsTUFBTSxzQkFBc0IsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDdkQsTUFBTSx3QkFBd0IsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUszRDs7R0FFRztBQUNVLFFBQUEsT0FBTyxHQUFHLENBQUMsR0FBVztJQUNsQyxNQUFNLENBQUMsQ0FBQyxNQUFjLEVBQUUsUUFBeUI7UUFDaEQsNEJBQTRCO1FBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDbEMsZ0NBQWdDO1FBQ2hDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JFLDZCQUE2QjtRQUM3QixRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLFFBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7UUFDekIsMkJBQTJCO1FBQzNCLE9BQU8sQ0FBQyxjQUFjLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzVELENBQUMsQ0FBQztBQUNILENBQUMsQ0FBQztBQUNGOzs7O0dBSUc7QUFDSCw2QkFBNkIsTUFBYyxFQUFFLGFBQThCO0lBQzFFLDRCQUE0QjtJQUM1QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0lBQ2xDLGdDQUFnQztJQUNoQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNyRSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzRSxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQUVEOztHQUVHO0FBQ0gsa0JBQXlCLE1BQWMsRUFBRSxRQUF5QjtJQUNqRSw0QkFBNEI7SUFDNUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztJQUNsQyxnQ0FBZ0M7SUFDaEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDdEUsNkJBQTZCO0lBQzdCLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDMUIsMkJBQTJCO0lBQzNCLE9BQU8sQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFURCw0QkFTQztBQUNEOzs7R0FHRztBQUNILG9CQUFvQixNQUFjLEVBQUUsUUFBeUI7SUFDNUQsNEJBQTRCO0lBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7SUFDbEMsZUFBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLGlCQUFpQixRQUFRLGlCQUFpQixFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3pFLGdDQUFnQztJQUNoQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUN0RSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqRSxNQUFNLENBQUMsS0FBSyxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7O0dBSUc7QUFDVSxRQUFBLGFBQWEsR0FBRyxDQUFDLFNBQTRCLEVBQUUsY0FBdUIsSUFBSTtJQUN0RixNQUFNLENBQUMsQ0FBQyxNQUFjLEVBQUUsUUFBeUI7UUFDaEQsNEJBQTRCO1FBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDbEMsZ0NBQWdDO1FBQ2hDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTNFLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUMsQ0FBQztRQUM5QywyQkFBMkI7UUFDM0IsT0FBTyxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEUsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBRUYsMkNBQTJDO0FBQzlCLFFBQUEsa0JBQWtCLEdBQXNDO0lBQ3BFLFNBQVMsRUFBRSxDQUFDLElBQWEsS0FBSyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUM7Q0FDMUMsQ0FBQztBQUNGLDBDQUEwQztBQUUxQzs7R0FFRztBQUNILHVCQUF1QixNQUFjLEVBQUUsUUFBeUI7SUFDL0QsNEJBQTRCO0lBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7SUFDbEMsZ0NBQWdDO0lBQ2hDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsc0JBQXNCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzNFLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQztJQUMzRSw2REFBNkQ7SUFDN0QsTUFBTSxJQUFJLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMvQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksSUFBSSwwQkFBa0IsQ0FBQyxDQUFDLENBQUM7UUFDN0MsTUFBTSxDQUFDLDBCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxDQUFDO0FBQ0YsQ0FBQztBQUVEOztHQUVHO0FBQ0gsMENBQTBDLE1BQWMsRUFBRSxRQUF5QjtJQUNsRiw0QkFBNEI7SUFDNUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztJQUNsQyxnQ0FBZ0M7SUFDaEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQkFBc0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFM0UsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxXQUFXLENBQUM7SUFDdkMsQ0FBQztJQUNELCtCQUErQjtJQUMvQixNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7O0dBSUc7QUFDVSxRQUFBLGVBQWUsR0FBRyxDQUFDLFNBQTRCLEVBQUUsY0FBdUIsSUFBSTtJQUN4RixNQUFNLENBQUMsQ0FBQyxNQUFjLEVBQUUsUUFBeUI7UUFDaEQsNEJBQTRCO1FBQzVCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDbEMsZ0NBQWdDO1FBQ2hDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTdFLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUMsQ0FBQztRQUM5QywyQkFBMkI7UUFDM0IsT0FBTyxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEUsQ0FBQyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBRUYsMkNBQTJDO0FBQzlCLFFBQUEsb0JBQW9CLEdBQXNDO0lBQ3RFLFNBQVMsRUFBRSxDQUFDLEdBQVEsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUssSUFBSTtDQUNwRixDQUFDO0FBQ0YsMENBQTBDO0FBRTFDOztHQUVHO0FBQ0gseUJBQXlCLE1BQWMsRUFBRSxRQUF5QjtJQUNqRSw0QkFBNEI7SUFDNUIsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztJQUNsQyxnQ0FBZ0M7SUFDaEMsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7SUFFN0UsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDckMsQ0FBQztJQUNELCtEQUErRDtJQUMvRCxNQUFNLElBQUksR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQy9DLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLDRCQUFvQixDQUFDLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsNEJBQW9CLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLENBQUM7QUFDRixDQUFDO0FBRUQ7O0dBRUc7QUFDSCw0Q0FBNEMsTUFBYyxFQUFFLFFBQXlCO0lBQ3BGLDRCQUE0QjtJQUM1QixNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDO0lBQ2xDLGdDQUFnQztJQUNoQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLHdCQUF3QixFQUFFLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUU3RSxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQztJQUN2QyxDQUFDO0lBQ0QsK0JBQStCO0lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDYixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxxQ0FBcUM7QUFDckMseUJBQXlCLE1BQWMsRUFBRSxRQUF5QjtJQUNqRSxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzdELENBQUMifQ==