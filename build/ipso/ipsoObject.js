"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var global_1 = require("../lib/global");
var object_polyfill_1 = require("../lib/object-polyfill");
// common base class for all objects that are transmitted somehow
var IPSOObject = (function () {
    function IPSOObject(sourceObj) {
        var properties = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            properties[_i - 1] = arguments[_i];
        }
        /** lookup dictionary for propName => key */
        this.keys = {};
        /** lookup dictionary for key => propName */
        this.propNames = {};
        /** lookup dictionary for key => default property value */
        this.defaultValues = {};
        /** lookup dictionary for key => property parser */
        this.parsers = {};
        // define properties if neccessary
        if (global_1.Global.isdef(properties))
            this.defineProperties(properties);
        // parse the contents of the source object
        if (global_1.Global.isdef(sourceObj))
            this.deserialize(sourceObj);
    }
    IPSOObject.prototype.defineProperties = function (properties) {
        for (var _i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
            var prop = properties_1[_i];
            var key = prop[0], propName = prop[1], options = prop.slice(2);
            // populate key lookup table
            this.keys[propName] = key;
            this.propNames[key] = propName;
            if (options && options.length) {
                // default value, set property
                this.defaultValues[key] = options[0];
                this[propName] = options[0];
                // parser
                if (options.length >= 1)
                    this.parsers[key] = options[1];
            }
        }
    };
    IPSOObject.prototype.getParser = function (key) {
        if (this.parsers.hasOwnProperty(key))
            return this.parsers[key];
    };
    // parses an object
    IPSOObject.prototype.deserialize = function (obj) {
        for (var _i = 0, _a = object_polyfill_1.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            // which property are we parsing?
            var propName = this.getPropName(key);
            if (!propName) {
                global_1.Global.log("{{yellow}}found unknown property with key " + key);
                continue;
            }
            // try to find parser for this property
            var parser = this.getParser(key);
            // parse the value
            var parsedValue = this.parseValue(key, value, parser);
            // and remember it
            this[propName] = parsedValue;
        }
    };
    // parses a value, depending on the value type and defined parsers
    IPSOObject.prototype.parseValue = function (propKey, value, parser) {
        var _this = this;
        if (parser === void 0) { parser = null; }
        if (value instanceof Array) {
            // Array: parse every element
            return value.map(function (v) { return _this.parseValue(propKey, v, parser); });
        }
        else if (typeof value === "object") {
            // Object: try to parse this, objects should be parsed in any case
            if (parser) {
                return parser(value);
            }
            else {
                global_1.Global.log("{{yellow}}could not find property parser for key " + propKey);
            }
        }
        else if (parser) {
            // if this property needs a parser, parse the value
            return parser(value);
        }
        else {
            // otherwise just return the value
            return value;
        }
    };
    IPSOObject.prototype.getKey = function (propName) { return this.keys[propName]; };
    IPSOObject.prototype.getPropName = function (key) { return this.propNames[key]; };
    // serializes this object in order to transfer it via COAP
    IPSOObject.prototype.serialize = function (reference) {
        if (reference === void 0) { reference = null; }
        var ret = {};
        var serializeValue = function (key, propName, value, refValue) {
            if (value instanceof IPSOObject) {
                // if the value is another IPSOObject, then serialize that
                value = value.serialize(refValue);
            }
            else {
                // if the value is not the default one, then remember it
                if (global_1.Global.isdef(refValue)) {
                    if (refValue === value)
                        return null;
                }
                else {
                    // there is no default value, just remember the actual value
                }
            }
            return value;
        };
        var refObj = reference || this.defaultValues;
        var _loop_1 = function (propName) {
            if (this_1.hasOwnProperty(propName)) {
                var key_1 = this_1.getKey(propName);
                var value = this_1[propName];
                var refValue_1 = null;
                if (global_1.Global.isdef(refObj) && refObj.hasOwnProperty(propName)) {
                    refValue_1 = refObj[propName];
                }
                if (value instanceof Array) {
                    // serialize each item
                    if (global_1.Global.isdef(refValue_1)) {
                        // reference value exists, make sure we have the same amount of items
                        if (!(refValue_1 instanceof Array && refValue_1.length === value.length)) {
                            throw new Error("cannot serialize arrays when the reference values don't match");
                        }
                        // serialize each item with the matching reference value
                        value = value.map(function (v, i) { return serializeValue(key_1, propName, v, refValue_1[i]); });
                    }
                    else {
                        // no reference value, makes things easier
                        value = value.map(function (v) { return serializeValue(key_1, propName, v, null); });
                    }
                    // now remove null items
                    value = value.filter(function (v) { return global_1.Global.isdef(v); });
                }
                else {
                    // directly serialize the value
                    value = serializeValue(key_1, propName, value, refValue_1);
                }
                ret[key_1] = value;
            }
        };
        var this_1 = this;
        // check all set properties
        for (var _i = 0, _a = object_polyfill_1.values(this.propNames); _i < _a.length; _i++) {
            var propName = _a[_i];
            _loop_1(propName);
        }
        return ret;
    };
    return IPSOObject;
}());
exports.IPSOObject = IPSOObject;
//# sourceMappingURL=ipsoObject.js.map