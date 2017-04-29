"use strict";

import { entries } from "../lib/object-polyfill";
import _ from "../lib/global";

const
	parsers = Symbol("parsers"),
	deserialize = Symbol("deserialize"),
	parseValue = Symbol("parseValue"),
	getParser = Symbol("getParser"),
	keys = Symbol("keys"),
	propNames = Symbol("propNames"),
	defaultValues = Symbol("defaultValues"),
	defineProperties = Symbol("defineProperties")
	;

// common base class for all objects that are transmitted somehow
export default class IPSOObject {

	constructor(sourceObj, ...properties) {
		// define properties if neccessary
		if (_.isdef(properties))
			this[defineProperties](properties);

		// parse the contents of the source object
		if (_.isdef(source))
			this[parse](source);
	}

	[defineProperties](...properties) {
		this[keys] = {}; // lookup dictionary for propName => key
		this[propNames] = {}; // lookup dictionary for key => propName
		this[defaultValues] = {}; // lookup dictionary for key => default property value
		this[parsers] = {}; // // lookup dictionary for key => property parser

		for (let [key, name, ...options] of properties) {
			// populate key lookup table
			this[keys][name] = key;
			this[propNames][key] = name;
			if (options && options.length) {
				// default value, set property
				this[defaultValues][key] = options[0];
				this[name] = options[0];
				// parser
				if (options.length >= 1)
					this[parsers][key] = options[1];
			}
		}
	}

	//// defines a parser function for partial objects
	//defineParser(key, fn) {
	//	if (!this[parsers].hasOwnProperty(key)) this[parsers][key] = fn;
	//}
	[getParser](key) {
		if (this[parsers].hasOwnProperty(key)) return this[parsers][key];
	}

	// parses an object
	[deserialize](obj) {
		for (let [key, value] of entries(obj)) {
			// which property are we parsing?
			const propName = this.getPropName(key);
			if (!propName) {
				_.log(`{{yellow}}found unknown property with key ${key}`);
				continue;
			}
			// try to find parser for this property
			const parser = this[getParser](key);
			// parse the value
			const parsedValue = this[parseValue](key, value, parser);
			// and remember it
			this[propName] = value;
		}
	}
	// parses a value, depending on the value type and defined parsers
	[parseValue](propKey, value, parser = null) {
		if (value instanceof Array) {
			// Array: parse every element
			return value.map(v => this[parseValue](propKey, value, parser));
		} else if (typeof value === "object") {
			// Object: try to parse this, objects should be parsed in any case
			if (parser) {
				value = parser(value);
			} else {
				_.log(`{{yellow}}could not find property parser for key ${key}`);
				return value;
			}
		} else if (parser) {
			// if this property needs a parser, parse the value
			return parser(value);
		} else {
			// otherwise just return the value
			return value;
		}
	}

	getKey(propName) { return this[keys][propName]; }
	getPropName(key) { return this[propNames][key]; }

	// serializes this object in order to transfer it via COAP
	serialize() {
		const ret = {};
		// check all set properties
		for (let propName of this[propNames]) {
			if (this.hasOwnProperty(propName)) {
				const key = this.getKey(propName);
				let value = this[propName];
				if (value instanceof IPSOObject) {
					// if the value is another IPSOObject, then serialize that
					value = value.serialize();
				} else {
					// if the value is not the default one, then remember it
					if (this[defaultValues].hasOwnProperty(key)) {
						const defaultValue = this[defaultValues][key];
						if (defaultValue === value) continue;
					} else {
						// there is no default value, just remember the actual value
					}
				}

				ret[key] = value;
			}
		}

		return ret;
	}

}