"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:unified-signatures
// tslint:disable:no-var-requires
const fs = require("fs");
// Get js-controller directory to load libs
function getControllerDir(isInstall) {
    // Find the js-controller location
    // tslint:disable-next-line:no-shadowed-variable
    let controllerDir = __dirname.replace(/\\/g, "/");
    controllerDir = controllerDir.split("/");
    if (controllerDir[controllerDir.length - 4] === "adapter") {
        controllerDir.splice(controllerDir.length - 4, 4);
        controllerDir = controllerDir.join("/");
    }
    else if (controllerDir[controllerDir.length - 4] === "node_modules") {
        controllerDir.splice(controllerDir.length - 4, 4);
        controllerDir = controllerDir.join("/");
        if (fs.existsSync(controllerDir + "/node_modules/iobroker.js-controller")) {
            controllerDir += "/node_modules/iobroker.js-controller";
        }
        else if (fs.existsSync(controllerDir + "/node_modules/ioBroker.js-controller")) {
            controllerDir += "/node_modules/ioBroker.js-controller";
        }
        else if (!fs.existsSync(controllerDir + "/controller.js")) {
            if (!isInstall) {
                console.log("Cannot find js-controller");
                process.exit(10);
            }
            else {
                process.exit();
            }
        }
    }
    else {
        if (!isInstall) {
            console.log("Cannot find js-controller");
            process.exit(10);
        }
        else {
            process.exit();
        }
    }
    return controllerDir;
}
// Read controller configuration file
const controllerDir = getControllerDir(typeof process !== "undefined" && process.argv && process.argv.indexOf("--install") !== -1);
function getConfig() {
    return JSON.parse(fs.readFileSync(controllerDir + "/conf/iobroker.json", "utf8"));
}
const adapter = require(controllerDir + "/lib/adapter.js");
exports.default = {
    controllerDir: controllerDir,
    getConfig: getConfig,
    adapter: adapter,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiRDovaW9Ccm9rZXIudHJhZGZyaS9zcmMvIiwic291cmNlcyI6WyJsaWIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvQ0FBb0M7QUFDcEMsaUNBQWlDO0FBQ2pDLHlCQUF5QjtBQUV6QiwyQ0FBMkM7QUFDM0MsMEJBQTBCLFNBQVM7SUFDbEMsa0NBQWtDO0lBQ2xDLGdEQUFnRDtJQUNoRCxJQUFJLGFBQWEsR0FBc0IsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDckUsYUFBYSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDekMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQztRQUMzRCxhQUFhLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xELGFBQWEsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssY0FBYyxDQUFDLENBQUMsQ0FBQztRQUN2RSxhQUFhLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xELGFBQWEsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxHQUFHLHNDQUFzQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLGFBQWEsSUFBSSxzQ0FBc0MsQ0FBQztRQUN6RCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsYUFBYSxHQUFHLHNDQUFzQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xGLGFBQWEsSUFBSSxzQ0FBc0MsQ0FBQztRQUN6RCxDQUFDO1FBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDN0QsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7Z0JBQ3pDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEIsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNQLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQixDQUFDO1FBQ0YsQ0FBQztJQUNGLENBQUM7SUFBQyxJQUFJLENBQUMsQ0FBQztRQUNQLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixDQUFDLENBQUM7WUFDekMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQixDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEIsQ0FBQztJQUNGLENBQUM7SUFDRCxNQUFNLENBQUMsYUFBdUIsQ0FBQztBQUNoQyxDQUFDO0FBRUQscUNBQXFDO0FBQ3JDLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLE9BQU8sT0FBTyxLQUFLLFdBQVcsSUFBSSxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbkk7SUFDQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsR0FBRyxxQkFBcUIsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQ25GLENBQUM7QUFFRCxNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsYUFBYSxHQUFHLGlCQUFpQixDQUFDLENBQUM7QUFFM0Qsa0JBQWU7SUFDZCxhQUFhLEVBQUUsYUFBYTtJQUM1QixTQUFTLEVBQUUsU0FBUztJQUNwQixPQUFPLEVBQUUsT0FBTztDQU1oQixDQUFDIn0=