import { Global as _ } from "../lib/global";
import { composeObject, DictionaryLike, entries, values } from "../lib/object-polyfill";

// common base class for all objects that are transmitted somehow
export class IPSOObject {

	/**
	 * Reads this instance's properties from the given object
	 */
	public parse(obj: DictionaryLike<any>): this {
		for (const [key, value] of entries(obj)) {
			// key might be ipso key or property name
			let deserializer: PropertyTransform = getDeserializer(this, key);
			let requiresArraySplitting: boolean = deserializerRequiresArraySplitting(this, key);
			let propName: string | symbol;
			if (deserializer == null) {
				// deserializers are defined by property name, so key is actually the key
				propName = lookupKeyOrProperty(this, key);
				if (!propName) {
					_.log(`{{yellow}}found unknown property with key ${key}`);
					continue;
				}
				deserializer = getDeserializer(this, propName);
				requiresArraySplitting = deserializerRequiresArraySplitting(this, propName);
			} else {
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
	private parseValue(propKey, value, deserializer?: PropertyTransform, requiresArraySplitting: boolean = true): any {
		if (value instanceof Array && requiresArraySplitting) {
			// Array: parse every element
			return value.map(v => this.parseValue(propKey, v, deserializer, requiresArraySplitting));
		} else if (typeof value === "object") {
			// Object: try to parse this, objects should be parsed in any case
			if (deserializer) {
				return deserializer(value);
			} else {
				_.log(`{{yellow}}could not find deserializer for key ${propKey}`);
			}
		} else if (deserializer) {
			// if this property needs a parser, parse the value
			return deserializer(value);
		} else {
			// otherwise just return the value
			return value;
		}
	}

	/**
	 * Overrides this object's properties with those from another partial one
	 */
	public merge(obj: Partial<this>): this {
		for (const [key, value] of entries(obj as DictionaryLike<any>)) {
			if (this.hasOwnProperty(key)) {
				this[key] = value;
			}
		}
		return this;
	}

	/** serializes this object in order to transfer it via COAP */
	public serialize(reference = null): DictionaryLike<any> {
		const ret = {};

		const serializeValue = (key, propName, value, refValue, transform?: PropertyTransform) => {
			const _required = isRequired(this, propName);
			let _ret = value;
			if (value instanceof IPSOObject) {
				// if the value is another IPSOObject, then serialize that
				_ret = value.serialize(refValue);
				// if the serialized object contains no required properties, don't remember it
				if (value.isSerializedObjectEmpty(_ret)) return null;
			} else {
				// if the value is not the default one, then remember it
				if (_.isdef(refValue)) {
					if (!_required && refValue === value) return null;
				} else {
					// there is no default value, just remember the actual value
				}
			}
			if (transform) _ret = transform(_ret);
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
				if (_.isdef(reference) && reference.hasOwnProperty(propName)) {
					refValue = reference[propName];
				}

				// try to find serializer for this property
				const serializer = getSerializer(this, propName);

				if (value instanceof Array) {
					// serialize each item
					if (_.isdef(refValue)) {
						// reference value exists, make sure we have the same amount of items
						if (!(refValue instanceof Array && refValue.length === value.length)) {
							throw new Error("cannot serialize arrays when the reference values don't match");
						}
						// serialize each item with the matching reference value
						value = value.map((v, i) => serializeValue(key, propName, v, refValue[i], serializer));
					} else {
						// no reference value, makes things easier
						value = value.map(v => serializeValue(key, propName, v, null, serializer));
					}
					// now remove null items
					value = value.filter(v => _.isdef(v));
					if (value.length === 0) value = null;
				} else {
					// directly serialize the value
					value = serializeValue(key, propName, value, refValue, serializer);
				}

				// only output the value if it's != null
				if (value != null) ret[key] = value;
			}
		}

		return ret;
	}

	/**
	 * Deeply clones an IPSO Object
	 */
	public clone(): this {
		// create a new instance of the same object as this
		interface Constructable<T> {
			new(): T;
		}
		const constructor = this.constructor as Constructable<this>;
		const ret = new constructor();
		// serialize the old values
		const serialized = this.serialize();
		// and parse them back
		return (ret as IPSOObject).parse(serialized) as this;
	}

	private isSerializedObjectEmpty(obj: DictionaryLike<any>): boolean {
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

// ===========================================================
// define decorators so we can define all properties type-safe
// tslint:disable:variable-name
const METADATA_ipsoKey = Symbol("ipsoKey");
const METADATA_required = Symbol("required");
const METADATA_serializeWith = Symbol("serializeWith");
const METADATA_deserializeWith = Symbol("deserializeWith");
// tslint:enable:variable-name

export type PropertyTransform = (value: any) => any;

/**
 * Defines the ipso key neccessary to serialize a property to a CoAP object
 */
export const ipsoKey = (key: string): PropertyDecorator => {
	return (target: object, property: string | symbol) => {
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
function lookupKeyOrProperty(target: object, keyOrProperty: string | symbol): string | symbol {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_ipsoKey, constr) || {};
	if (metadata.hasOwnProperty(keyOrProperty)) return metadata[keyOrProperty];
	return null;
}

/**
 * Declares that a property is required to be present in a serialized CoAP object
 */
export function required(target: object, property: string | symbol): void {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
	// and enhance it (both ways)
	metadata[property] = true;
	// store back to the object
	Reflect.defineMetadata(METADATA_required, metadata, constr);
}
/**
 * Checks if a property is required to be present in a serialized CoAP object
 * @param property - property name to lookup
 */
function isRequired(target: object, property: string | symbol): boolean {
	// get the class constructor
	const constr = target.constructor;
	_.log(`${constr.name}: checking if ${property} is required...`, "silly");
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_required, constr) || {};
	if (metadata.hasOwnProperty(property)) return metadata[property];
	return false;
}

/**
 * Defines the required transformations to serialize a property to a CoAP object
 */
export const serializeWith = (transform: PropertyTransform): PropertyDecorator => {
	return (target: object, property: string | symbol) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};

		metadata[property] = transform;
		// store back to the object
		Reflect.defineMetadata(METADATA_serializeWith, metadata, constr);
	};
};

// tslint:disable:object-literal-key-quotes
export const defaultSerializers: DictionaryLike<PropertyTransform> = {
	"Boolean": (bool: boolean) => bool ? 1 : 0,
};
// tslint:enable:object-literal-key-quotes

/**
 * Retrieves the serializer for a given property
 */
function getSerializer(target: object, property: string | symbol): PropertyTransform {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_serializeWith, constr) || {};
	if (metadata.hasOwnProperty(property)) return metadata[property];
	// If there's no custom serializer, try to find a default one
	const type = getPropertyType(target, property);
	if (type && type.name in defaultSerializers) {
		return defaultSerializers[type.name];
	}
}

/**
 * Defines the required transformations to deserialize a property from a CoAP object
 * @param transform: The transformation to apply during deserialization
 * @param splitArrays: Whether the deserializer expects arrays to be split up in advance
 */
export const deserializeWith = (transform: PropertyTransform, splitArrays: boolean = true): PropertyDecorator => {
	return (target: object, property: string | symbol) => {
		// get the class constructor
		const constr = target.constructor;
		// retrieve the current metadata
		const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

		metadata[property] = {transform, splitArrays};
		// store back to the object
		Reflect.defineMetadata(METADATA_deserializeWith, metadata, constr);
	};
};

// tslint:disable:object-literal-key-quotes
export const defaultDeserializers: DictionaryLike<PropertyTransform> = {
	"Boolean": (raw: any) => raw === 1 || raw === "true" || raw === "on" || raw === true,
};
// tslint:enable:object-literal-key-quotes

/**
 * Retrieves the deserializer for a given property
 */
function getDeserializer(target: object, property: string | symbol): PropertyTransform {
	// get the class constructor
	const constr = target.constructor;
	// retrieve the current metadata
	const metadata = Reflect.getMetadata(METADATA_deserializeWith, constr) || {};

	if (metadata.hasOwnProperty(property)) {
		return metadata[property].transform;
	}
	// If there's no custom deserializer, try to find a default one
	const type = getPropertyType(target, property);
	if (type && type.name in defaultDeserializers) {
		return defaultDeserializers[type.name];
	}
}

/**
 * Retrieves the deserializer for a given property
 */
function deserializerRequiresArraySplitting(target: object, property: string | symbol): boolean {
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
function getPropertyType(target: object, property: string | symbol): Function {
	return Reflect.getMetadata("design:type", target, property);
}
