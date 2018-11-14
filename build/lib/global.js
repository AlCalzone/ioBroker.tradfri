"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("alcalzone-shared/async");
const objects_1 = require("alcalzone-shared/objects");
class Global {
    static get adapter() { return Global._adapter; }
    static set adapter(adapter) {
        Global._adapter = adapter;
    }
    static extend(adapter) {
        // Eine Handvoll Funktionen promisifizieren
        let ret = adapter;
        if (!ret.__isExtended) {
            // ret.objects.$getObjectList = promisify(adapter.objects.getObjectList, adapter.objects);
            ret = Object.assign(ret, {
                $getObject: async_1.promisify(adapter.getObject, adapter),
                $setObject: async_1.promisify(adapter.setObject, adapter),
                $setObjectNotExists: async_1.promisify(adapter.setObjectNotExists, adapter),
                $extendObject: async_1.promisify(adapter.extendObject, adapter),
                $getAdapterObjects: async_1.promisify(adapter.getAdapterObjects, adapter),
                $getForeignObject: async_1.promisify(adapter.getForeignObject, adapter),
                $setForeignObject: async_1.promisify(adapter.setForeignObject, adapter),
                $setForeignObjectNotExists: async_1.promisify(adapter.setForeignObjectNotExists, adapter),
                $extendForeignObject: async_1.promisify(adapter.extendForeignObject, adapter),
                $getForeignObjects: async_1.promisify(adapter.getForeignObjects, adapter),
                $createDevice: async_1.promisify(adapter.createDevice, adapter),
                $deleteDevice: async_1.promisify(adapter.deleteDevice, adapter),
                $createChannel: async_1.promisify(adapter.createChannel, adapter),
                $deleteChannel: async_1.promisify(adapter.deleteChannel, adapter),
                $getState: async_1.promisify(adapter.getState, adapter),
                $getStates: async_1.promisify(adapter.getStates, adapter),
                $setState: async_1.promisify(adapter.setState, adapter),
                $setStateChanged: async_1.promisify(adapter.setStateChanged, adapter),
                $createState: async_1.promisify(adapter.createState, adapter),
                $deleteState: async_1.promisify(adapter.deleteState, adapter),
                $delState: async_1.promisify(adapter.delState, adapter),
                $getForeignState: async_1.promisify(adapter.getForeignState, adapter),
                $setForeignState: async_1.promisify(adapter.setForeignState, adapter),
                $sendTo: async_1.promisifyNoError(adapter.sendTo, adapter),
            });
        }
        ret.$createOwnState = (id, initialValue, ack = true, commonType = "mixed") => __awaiter(this, void 0, void 0, function* () {
            yield ret.$setObject(id, {
                type: "state",
                common: {
                    name: id,
                    role: "value",
                    type: commonType,
                    read: true,
                    write: true,
                },
                native: {},
            });
            if (initialValue != undefined)
                yield ret.$setState(id, initialValue, ack);
        });
        ret.$createOwnStateEx = (id, obj, initialValue, ack = true) => __awaiter(this, void 0, void 0, function* () {
            yield ret.$setObject(id, obj);
            if (initialValue != undefined)
                yield ret.$setState(id, initialValue, ack);
        });
        return ret;
    }
    /*
        Formatierungen:
        **fett**, ##kursiv##, __unterstrichen__, ~~durchgestrichen~~
        schwarz{{farbe|bunt}}schwarz, {{farbe}}bunt
    */
    static log(message, level = "info") {
        if (!Global.adapter)
            return;
        // if (message) {
        // 	// Farben und Formatierungen
        // 	for (const [/*key*/, [regex, repl]] of entries(replacements)) {
        // 		if (typeof repl === "string") {
        // 			message = message.replace(regex, repl);
        // 		} else { // a bit verbose, but TS doesn't get the overload thingy here
        // 			message = message.replace(regex, repl);
        // 		}
        // 	}
        // }
        if (level === "silly" && !(level in Global._adapter.log))
            level = "debug";
        Global._adapter.log[level](message);
    }
    /**
     * Kurzschreibweise für die Ermittlung eines Objekts
     * @param id
     */
    static $(id) {
        return Global._adapter.$getForeignObject(id);
    }
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    static $$(pattern, type, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield Global._adapter.$getForeignObjects(pattern, type);
            if (role) {
                return objects_1.filter(objects, o => o.common.role === role);
            }
            else {
                return objects;
            }
        });
    }
}
exports.Global = Global;
