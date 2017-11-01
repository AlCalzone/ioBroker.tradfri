"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("../lib/global");
const str2regex_1 = require("../lib/str2regex");
const customStateSubscriptions = {
    subscriptions: new Map(),
    counter: 0,
};
const customObjectSubscriptions = {
    subscriptions: new Map(),
    counter: 0,
};
/**
 * Ensures the subscription pattern is valid
 */
function checkPattern(pattern) {
    try {
        if (typeof pattern === "string") {
            return str2regex_1.str2regex(pattern);
        }
        else if (pattern instanceof RegExp) {
            return pattern;
        }
        else {
            // NOPE
            throw new Error("must be regex or string");
        }
    }
    catch (e) {
        global_1.Global.log("cannot subscribe with this pattern. reason: " + e);
        return null;
    }
}
function applyCustomStateSubscriptions(id, state) {
    try {
        for (const sub of customStateSubscriptions.subscriptions.values()) {
            if (sub && sub.pattern && sub.callback) {
                // Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
                if (sub.pattern.test(id))
                    sub.callback(id, state);
            }
        }
    }
    catch (e) {
        global_1.Global.log("error handling custom sub: " + e);
    }
}
exports.applyCustomStateSubscriptions = applyCustomStateSubscriptions;
function applyCustomObjectSubscriptions(id, obj) {
    try {
        for (const sub of customObjectSubscriptions.subscriptions.values()) {
            if (sub && sub.pattern && sub.callback) {
                // Wenn die ID zum aktuellen Pattern passt, dann Callback aufrufen
                if (sub.pattern.test(id))
                    sub.callback(id, obj);
            }
        }
    }
    catch (e) {
        global_1.Global.log("error handling custom sub: " + e);
    }
}
exports.applyCustomObjectSubscriptions = applyCustomObjectSubscriptions;
/**
 * Subscribe to some ioBroker states
 * @param pattern
 * @param callback
 * @returns a subscription ID
 */
function subscribeStates(pattern, callback) {
    pattern = checkPattern(pattern);
    if (!pattern)
        return;
    const newCounter = (++customStateSubscriptions.counter);
    const id = "" + newCounter;
    customStateSubscriptions.subscriptions.set(id, { pattern, callback });
    return id;
}
exports.subscribeStates = subscribeStates;
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeStates}
 */
function unsubscribeStates(id) {
    if (customStateSubscriptions.subscriptions.has(id)) {
        customStateSubscriptions.subscriptions.delete(id);
    }
}
exports.unsubscribeStates = unsubscribeStates;
/**
 * Subscribe to some ioBroker objects
 * @param pattern
 * @param callback
 * @returns a subscription ID
 */
function subscribeObjects(pattern, callback) {
    pattern = checkPattern(pattern);
    if (!pattern)
        return;
    const newCounter = (++customObjectSubscriptions.counter);
    const id = "" + newCounter;
    customObjectSubscriptions.subscriptions.set(id, { pattern, callback });
    return id;
}
exports.subscribeObjects = subscribeObjects;
/**
 * Release the custom subscription with the given id
 * @param id The subscription ID returned by @link{subscribeObjects}
 */
function unsubscribeObjects(id) {
    if (customObjectSubscriptions.subscriptions.has(id)) {
        customObjectSubscriptions.subscriptions.delete(id);
    }
}
exports.unsubscribeObjects = unsubscribeObjects;
