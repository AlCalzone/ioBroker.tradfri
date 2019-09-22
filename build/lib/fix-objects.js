"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const objects_1 = require("alcalzone-shared/objects");
const global_1 = require("./global");
const io_package_json_1 = require("../../io-package.json");
const instanceObjects = io_package_json_1.instanceObjects;
/**
 * Fixes/updates/deletes existing adapter objects,
 * so they don't have to be deleted manually
 */
function fixAdapterObjects() {
    return __awaiter(this, void 0, void 0, function* () {
        // read all objects, we'll filter them in the fixer functions
        const stateObjs = objects_1.values(yield global_1.Global.$$(`${global_1.Global.adapter.namespace}.*`, "state"));
        // const channelObjs = values(await _.$$(`${_.adapter.namespace}.*`, "channel"));
        // const deviceObjs = values(await _.$$(`${_.adapter.namespace}.*`, "device"));
        yield fixBrightnessRange(stateObjs);
        yield fixAuthenticationObjects();
        yield fixBrightnessRole(stateObjs);
    });
}
exports.fixAdapterObjects = fixAdapterObjects;
/**
 * In v0.5.4, the brightness range was changed from 0..254 to 0..100%
 */
function fixBrightnessRange(stateObjs) {
    return __awaiter(this, void 0, void 0, function* () {
        const predicate = /(G|VG|L)\-\d+\.(lightbulb\.)?brightness$/;
        const fixableObjs = stateObjs.filter(o => predicate.test(o._id));
        for (const obj of fixableObjs) {
            const oldCommon = JSON.stringify(obj.common);
            const newCommon = JSON.stringify(Object.assign(Object.assign({ name: "Brightness" }, obj.common), { min: 0, max: 100, unit: "%" }));
            if (oldCommon !== newCommon) {
                obj.common = JSON.parse(newCommon);
                yield global_1.Global.adapter.setForeignObjectAsync(obj._id, obj);
            }
        }
    });
}
/**
 * In v0.6.0, the authentication procedure was changed to no longer
 * store the security code.
 * From v0.6.0-beta2 to -beta3, the info.identity object was removed in favor of config properties.
 */
function fixAuthenticationObjects() {
    return __awaiter(this, void 0, void 0, function* () {
        const identityObj = yield global_1.Global.adapter.getObjectAsync("info.identity");
        if (identityObj != null) {
            yield global_1.Global.adapter.delState("info.identity");
            yield global_1.Global.adapter.delObject("info.identity");
        }
    });
}
/**
 * In v1.0.5, the brightness role was changed from "light.dimmer" to "level.dimmer"
 */
function fixBrightnessRole(stateObjs) {
    return __awaiter(this, void 0, void 0, function* () {
        const predicate = /(G|VG|L)\-\d+\.(lightbulb\.)?brightness$/;
        const fixableObjs = stateObjs.filter(o => predicate.test(o._id));
        for (const obj of fixableObjs) {
            const oldCommon = JSON.stringify(obj.common);
            const newCommon = JSON.stringify(Object.assign(Object.assign({}, obj.common), { role: "level.dimmer" }));
            if (oldCommon !== newCommon) {
                obj.common = JSON.parse(newCommon);
                yield global_1.Global.adapter.setForeignObjectAsync(obj._id, obj);
            }
        }
    });
}
// Workaround für unvollständige Adapter-Upgrades
function ensureInstanceObjects() {
    return __awaiter(this, void 0, void 0, function* () {
        if (instanceObjects == null || instanceObjects.length === 0)
            return;
        // wait for all instance objects to be created
        const setObjects = instanceObjects.map(obj => global_1.Global.adapter.setObjectNotExistsAsync(obj._id, obj));
        yield Promise.all(setObjects);
    });
}
exports.ensureInstanceObjects = ensureInstanceObjects;
