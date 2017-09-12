"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_1 = require("../lib/global");
var object_polyfill_1 = require("../lib/object-polyfill");
// common base class for all objects that are transmitted somehow
var IPSOObject = (function () {
    function IPSOObject() {
    }
    /**
     * Reads this instance's properties from the given object
     */
    IPSOObject.prototype.parse = function (obj) {
        for (var _i = 0, _a = object_polyfill_1.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            // key might be ipso key or property name
            var deserializer = getDeserializer(this, key);
            var propName = void 0;
            if (deserializer == null) {
                // deserializers are defined by property name, so key is actually the key
                propName = lookupKeyOrProperty(this, key);
                if (!propName) {
                    global_1.Global.log("{{yellow}}found unknown property with key " + key);
                    continue;
                }
                deserializer = getDeserializer(this, propName);
            }
            else {
                // the deserializer was found, so key is actually the property name
                propName = key;
            }
            // parse the value
            var parsedValue = this.parseValue(key, value, deserializer);
            // and remember it
            this[propName] = parsedValue;
        }
        return this;
    };
    // parses a value, depending on the value type and defined parsers
    IPSOObject.prototype.parseValue = function (propKey, value, deserializer) {
        var _this = this;
        if (value instanceof Array) {
            // Array: parse every element
            return value.map(function (v) { return _this.parseValue(propKey, v, deserializer); });
        }
        else if (typeof value === "object") {
            // Object: try to parse this, objects should be parsed in any case
            if (deserializer) {
                return deserializer(value);
            }
            else {
                global_1.Global.log("{{yellow}}could not find deserializer for key " + propKey);
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
    };
    /**
     * Overrides this object's properties with those from another partial one
     */
    IPSOObject.prototype.merge = function (obj) {
        for (var _i = 0, _a = object_polyfill_1.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (this.hasOwnProperty(key)) {
                this[key] = value;
            }
        }
        return this;
    };
    /** serializes this object in order to transfer it via COAP */
    IPSOObject.prototype.serialize = function (reference) {
        var _this = this;
        if (reference === void 0) { reference = null; }
        var ret = {};
        var serializeValue = function (key, propName, value, refValue, transform) {
            var _required = isRequired(_this, propName);
            var _ret = value;
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
        var _loop_1 = function (propName) {
            if (this_1.hasOwnProperty(propName)) {
                // find IPSO key
                var key_1 = lookupKeyOrProperty(this_1, propName);
                // find value and reference (default) value
                var value = this_1[propName];
                var refValue_1 = null;
                if (global_1.Global.isdef(reference) && reference.hasOwnProperty(propName)) {
                    refValue_1 = reference[propName];
                }
                // try to find serializer for this property
                var serializer_1 = getSerializer(this_1, propName);
                if (value instanceof Array) {
                    // serialize each item
                    if (global_1.Global.isdef(refValue_1)) {
                        // reference value exists, make sure we have the same amount of items
                        if (!(refValue_1 instanceof Array && refValue_1.length === value.length)) {
                            throw new Error("cannot serialize arrays when the reference values don't match");
                        }
                        // serialize each item with the matching reference value
                        value = value.map(function (v, i) { return serializeValue(key_1, propName, v, refValue_1[i], serializer_1); });
                    }
                    else {
                        // no reference value, makes things easier
                        value = value.map(function (v) { return serializeValue(key_1, propName, v, null, serializer_1); });
                    }
                    // now remove null items
                    value = value.filter(function (v) { return global_1.Global.isdef(v); });
                    if (value.length === 0)
                        value = null;
                }
                else {
                    // directly serialize the value
                    value = serializeValue(key_1, propName, value, refValue_1, serializer_1);
                }
                // only output the value if it's != null
                if (value != null)
                    ret[key_1] = value;
            }
        };
        var this_1 = this;
        // const refObj = reference || getDefaultValues(this); //this.defaultValues;
        // check all set properties
        for (var _i = 0, _a = Object.keys(this); _i < _a.length; _i++) {
            var propName = _a[_i];
            _loop_1(propName);
        }
        return ret;
    };
    /**
     * Deeply clones an IPSO Object
     */
    IPSOObject.prototype.clone = function () {
        // create a new instance of the same object as this
        var constructor = this.constructor;
        function F() {
            return constructor.apply(this);
        }
        F.prototype = constructor.prototype;
        var ret = new F();
        // serialize the old values
        var serialized = this.serialize();
        // and parse them back
        return ret.parse(serialized);
    };
    IPSOObject.prototype.isSerializedObjectEmpty = function (obj) {
        // Prüfen, ob eine nicht-benötigte Eigenschaft angegeben ist. => nicht leer
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var key = _a[_i];
            var propName = lookupKeyOrProperty(this, key);
            if (!isRequired(this, propName)) {
                return false;
            }
        }
        return true;
    };
    return IPSOObject;
}());
exports.IPSOObject = IPSOObject;
// ===========================================================
// define decorators so we can define all properties type-safe
// tslint:disable:variable-name
var METADATA_ipsoKey = Symbol("ipsoKey");
var METADATA_required = Symbol("required");
var METADATA_serializeWith = Symbol("serializeWith");
var METADATA_deserializeWith = Symbol("deserializeWith");
/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
exports.ipsoKey = function (key) {
    return function (target, property) {
        // get the class constructor
        var constr = target.constructor;
        // retrieve the current metadata
        var metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
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
    var constr = target.constructor;
    // retrieve the current metadata
    var metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
    if (metadata.hasOwnProperty(keyOrProperty))
        return metadata[keyOrProperty];
    return null;
}
/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
function required(target, property) {
    // get the class constructor
    var constr = target.constructor;
    // retrieve the current metadata
    var metadata = Reflect.getMetadata(METADATA_required, constr) || {};
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
    var constr = target.constructor;
    console.log(constr.name + ": checking if " + property + " is required...");
    // retrieve the current metadata
    var metadata = Reflect.getMetadata(METADATA_required, constr) || {};
    if (metadata.hasOwnProperty(property))
        return metadata[property];
    return false;
}
/**
 * Defines the required transformations to serialize a property to a CoAP object
 */
exports.serializeWith = function (transform) {
    return function (target, property) {
        // get the class constructor
        var constr = target.constructor;
        // retrieve the current metadata
        var metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
        metadata[property] = transform;
        // store back to the object
        Reflect.defineMetadata(METADATA_serializeWith, metadata, constr);
    };
};
// tslint:disable:object-literal-key-quotes
exports.defaultSerializers = {
    "Boolean": function (bool) { return bool ? 1 : 0; },
};
// tslint:enable:object-literal-key-quotes
/**
 * Retrieves the serializer for a given property
 */
function getSerializer(target, property) {
    // get the class constructor
    var constr = target.constructor;
    // retrieve the current metadata
    var metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
    if (metadata.hasOwnProperty(property))
        return metadata[property];
    // If there's no custom serializer, try to find a default one
    var type = getPropertyType(target, property);
    if (type && type.name in exports.defaultSerializers) {
        return exports.defaultSerializers[type.name];
    }
}
/**
 * Defines the required transformations to deserialize a property from a CoAP object
 */
exports.deserializeWith = function (transform) {
    return function (target, property) {
        // get the class constructor
        var constr = target.constructor;
        // retrieve the current metadata
        var metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};
        metadata[property] = transform;
        // store back to the object
        Reflect.defineMetadata(METADATA_deserializeWith, metadata, constr);
    };
};
// tslint:disable:object-literal-key-quotes
exports.defaultDeserializers = {
    "Boolean": function (raw) { return raw === 1 || raw === "true" || raw === "on" || raw === true; },
};
// tslint:enable:object-literal-key-quotes
/**
 * Retrieves the deserializer for a given property
 */
function getDeserializer(target, property) {
    // get the class constructor
    var constr = target.constructor;
    // retrieve the current metadata
    var metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};
    if (metadata.hasOwnProperty(property)) {
        return metadata[property];
    }
    // If there's no custom deserializer, try to find a default one
    var type = getPropertyType(target, property);
    if (type && type.name in exports.defaultDeserializers) {
        return exports.defaultDeserializers[type.name];
    }
}
/**
 * Finds the design type for a given property
 */
// tslint:disable-next-line:ban-types
function getPropertyType(target, property) {
    return Reflect.getMetadata("design:type", target, property);
}
//# sourceMappingURL=ipsoObject.js.map