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
class Global {
    static get adapter() { return Global._adapter; }
    static set adapter(adapter) {
        Global._adapter = adapter;
    }
    static extend(adapter) {
        // Eine Handvoll Funktionen promisifizieren
        const ret = adapter;
        ret.createOwnStateAsync = (id, initialValue, ack = true, commonType = "mixed") => __awaiter(this, void 0, void 0, function* () {
            yield ret.setObjectAsync(id, {
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
                yield ret.setStateAsync(id, initialValue, ack);
        });
        ret.createOwnStateExAsync = (id, obj, initialValue, ack = true) => __awaiter(this, void 0, void 0, function* () {
            yield ret.setObjectAsync(id, obj);
            if (initialValue != undefined)
                yield ret.setStateAsync(id, initialValue, ack);
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
        return Global._adapter.getForeignObjectAsync(id);
    }
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    static $$(pattern, type, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield Global._adapter.getForeignObjectsAsync(pattern, type);
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
