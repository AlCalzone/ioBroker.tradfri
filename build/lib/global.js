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
const fs = require("fs");
const path = require("path");
const object_polyfill_1 = require("./object-polyfill");
const promises_1 = require("./promises");
// ==================================
const colors = {
    red: "#db3340",
    yellow: "#ffa200",
    green: "#5bb12f",
    blue: "#0087cb",
};
const replacements = {
    bold: [/\*{2}(.*?)\*{2}/g, "<b>$1</b>"],
    italic: [/#{2}(.*?)#{2}/g, "<i>$1</i>"],
    underline: [/_{2}(.*?)_{2}/g, "<u>$1</u>"],
    strikethrough: [/\~{2}(.*?)\~{2}/g, "<s>$1</s>"],
    color: [/\{{2}(\w+)\|(.*?)\}{2}/, (str, p1, p2) => {
            const color = colors[p1];
            if (!color)
                return str;
            return `<span style="color: ${color}">${p2}</span>`;
        }],
    fullcolor: [/^\{{2}(\w+)\}{2}(.*?)$/, (str, p1, p2) => {
            const color = colors[p1];
            if (!color)
                return str;
            return `<span style="color: ${color}">${p2}</span>`;
        }],
};
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
                $getObject: promises_1.promisify(adapter.getObject, adapter),
                $setObject: promises_1.promisify(adapter.setObject, adapter),
                $setObjectNotExists: promises_1.promisify(adapter.setObjectNotExists, adapter),
                $extendObject: promises_1.promisify(adapter.extendObject, adapter),
                $getAdapterObjects: promises_1.promisify(adapter.getAdapterObjects, adapter),
                $getForeignObject: promises_1.promisify(adapter.getForeignObject, adapter),
                $setForeignObject: promises_1.promisify(adapter.setForeignObject, adapter),
                $setForeignObjectNotExists: promises_1.promisify(adapter.setForeignObjectNotExists, adapter),
                $extendForeignObject: promises_1.promisify(adapter.extendForeignObject, adapter),
                $getForeignObjects: promises_1.promisify(adapter.getForeignObjects, adapter),
                $createDevice: promises_1.promisify(adapter.createDevice, adapter),
                $deleteDevice: promises_1.promisify(adapter.deleteDevice, adapter),
                $createChannel: promises_1.promisify(adapter.createChannel, adapter),
                $deleteChannel: promises_1.promisify(adapter.deleteChannel, adapter),
                $getState: promises_1.promisify(adapter.getState, adapter),
                $getStates: promises_1.promisify(adapter.getStates, adapter),
                $setState: promises_1.promisify(adapter.setState, adapter),
                $setStateChanged: promises_1.promisify(adapter.setStateChanged, adapter),
                $createState: promises_1.promisify(adapter.createState, adapter),
                $deleteState: promises_1.promisify(adapter.deleteState, adapter),
                $getForeignState: promises_1.promisify(adapter.getForeignState, adapter),
                $setForeignState: promises_1.promisify(adapter.setForeignState, adapter),
                $sendTo: promises_1.promisifyNoError(adapter.sendTo, adapter),
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
        if (message) {
            // Farben und Formatierungen
            for (const [/*key*/ , [regex, repl]] of object_polyfill_1.entries(replacements)) {
                if (typeof repl === "string") {
                    message = message.replace(regex, repl);
                }
                else {
                    message = message.replace(regex, repl);
                }
            }
        }
        if (level === "silly" && !(level in Global._adapter.log))
            level = "debug";
        Global._adapter.log[level](message);
    }
    /**
     * Kurzschreibweise für die Ermittlung eines Objekts
     * @param id
     */
    static $(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Global._adapter.$getForeignObject(id);
        });
    }
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    static $$(pattern, type, role) {
        return __awaiter(this, void 0, void 0, function* () {
            const objects = yield Global._adapter.$getForeignObjects(pattern, type);
            if (role) {
                return object_polyfill_1.filter(objects, o => o.common.role === role);
            }
            else {
                return objects;
            }
        });
    }
    // Prüfen auf (un)defined
    static isdef(value) { return value != undefined; }
    // Workaround für unvollständige Adapter-Upgrades
    static ensureInstanceObjects() {
        return __awaiter(this, void 0, void 0, function* () {
            // read io-package.json
            const ioPack = JSON.parse(fs.readFileSync(path.join(__dirname, "../../io-package.json"), "utf8"));
            if (ioPack.instanceObjects == null || ioPack.instanceObjects.length === 0)
                return;
            // wait for all instance objects to be created
            const setObjects = ioPack.instanceObjects.map(obj => Global._adapter.$setObjectNotExists(obj._id, obj));
            yield Promise.all(setObjects);
        });
    }
}
exports.Global = Global;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYmFsLmpzIiwic291cmNlUm9vdCI6IkQ6L2lvQnJva2VyLnRyYWRmcmkvc3JjLyIsInNvdXJjZXMiOlsibGliL2dsb2JhbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEseUJBQXlCO0FBQ3pCLDZCQUE2QjtBQUM3Qix1REFBaUY7QUFDakYseUNBQXlEO0FBRXpELHFDQUFxQztBQUVyQyxNQUFNLE1BQU0sR0FBRztJQUNkLEdBQUcsRUFBRSxTQUFTO0lBQ2QsTUFBTSxFQUFFLFNBQVM7SUFDakIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsSUFBSSxFQUFFLFNBQVM7Q0FDZixDQUFDO0FBRUYsTUFBTSxZQUFZLEdBRWQ7SUFDSCxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUM7SUFDdkMsTUFBTSxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDO0lBQ3ZDLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixFQUFFLFdBQVcsQ0FBQztJQUMxQyxhQUFhLEVBQUUsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUM7SUFDaEQsS0FBSyxFQUFFLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDN0MsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7WUFFdkIsTUFBTSxDQUFDLHVCQUF1QixLQUFLLEtBQUssRUFBRSxTQUFTLENBQUM7UUFDckQsQ0FBQyxDQUFDO0lBQ0YsU0FBUyxFQUFFLENBQUMsd0JBQXdCLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDakQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pCLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUFDLE1BQU0sQ0FBQyxHQUFH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