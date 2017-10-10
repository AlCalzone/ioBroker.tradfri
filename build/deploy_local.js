"use strict";
// tslint:disable:no-var-requires
/*
    Allows easier local debugging over SSH.
    Running `npm run deploy_local` updates remote adapter files
    and restarts the instance
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
    CONFIGURATION:
        - provide a deploy_password.json file in the project root with contents
            {
                "host": "<HOSTNAME>",
                "username": "<USERNAME>",
                "password": "<PASSWORD>"
            }
        - specify which dirs and files should be uploaded
        - specify where the root dir is relative to this script
*/
const uploadDirs = ["admin", "build"];
const uploadFiles = ["package.json", "io-package.json", "main.js"];
const rootDir = "../";
const nodeSSH = require("node-ssh");
const path = require("path");
const localRoot = path.resolve(__dirname, rootDir);
const ioPack = require(path.join(rootDir, "io-package.json"));
const ADAPTER_NAME = ioPack.common.name;
const ssh = new nodeSSH();
const sshConfig = require(path.join(rootDir, "deploy_password.json"));
const remoteRoot = `/opt/iobroker/node_modules/iobroker.${ADAPTER_NAME}`;
(function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield ssh.connect(sshConfig);
        for (const dir of uploadDirs) {
            console.log(`uploading ${dir} dir...`);
            yield ssh.putDirectory(path.join(localRoot, dir), path.join(remoteRoot, dir), {
                recursive: true,
                concurrency: 10,
                validate: (pathname) => {
                    const basename = path.basename(pathname);
                    if (basename.startsWith("deploy_"))
                        return false;
                    if (basename.endsWith("Thumbs.db"))
                        return false;
                    return true;
                },
            });
        }
        for (const file of uploadFiles) {
            console.log(`uploading ${file}...`);
            yield ssh.putFile(path.join(localRoot, file), path.join(remoteRoot, file));
        }
        // update in-mem adapter
        let execResult;
        console.log("updating in-mem adapter");
        execResult = yield ssh.execCommand(`iobroker upload ${ADAPTER_NAME}`);
        console.log(execResult.stdout);
        console.log(execResult.stderr);
        execResult = yield ssh.execCommand(`iobroker restart ${ADAPTER_NAME}`);
        console.log(execResult.stdout);
        console.log(execResult.stderr);
        console.log("done");
        process.exit(0);
    });
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwbG95X2xvY2FsLmpzIiwic291cmNlUm9vdCI6IkQ6L2lvQnJva2VyLnRyYWRmcmkvc3JjLyIsInNvdXJjZXMiOlsiZGVwbG95X2xvY2FsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxpQ0FBaUM7QUFDakM7Ozs7RUFJRTs7Ozs7Ozs7OztBQUVGOzs7Ozs7Ozs7O0VBVUU7QUFDRixNQUFNLFVBQVUsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN0QyxNQUFNLFdBQVcsR0FBRyxDQUFDLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNuRSxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFPdEIsb0NBQW9DO0FBQ3BDLDZCQUE2QjtBQUU3QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUVuRCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQzlELE1BQU0sWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO0FBRXhDLE1BQU0sR0FBRyxHQUFHLElBQUksT0FBTyxFQUFFLENBQUM7QUFDMUIsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLHNCQUFzQixDQUFDLENBQUMsQ0FBQztBQUV0RSxNQUFNLFVBQVUsR0FBRyx1Q0FBdUMsWUFBWSxFQUFFLENBQUM7QUFFekUsQ0FBQzs7UUFDQSxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFN0IsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQztZQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUN2QyxNQUFNLEdBQUcsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLEVBQUU7Z0JBQzdFLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFdBQVcsRUFBRSxFQUFFO2dCQUNmLFFBQVEsRUFBRSxDQUFDLFFBQVE7b0JBQ2xCLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3pDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7d0JBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztvQkFDakQsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQzt3QkFBQyxNQUFNLENBQUMsS0FBSyxDQUFDO29CQUNqRCxNQUFNLENBQUMsSUFBSSxDQUFDO2dCQUNiLENBQUM7YUFDRCxDQUFDLENBQUM7UUFDSixDQUFDO1FBQ0QsR0FBRyxDQUFDLENBQUMsTUFBTSxJQUFJLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQztZQUNoQyxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsQ0FBQztZQUNwQyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM1RSxDQUFDO1FBRUQsd0JBQXdCO1FBQ3hCLElBQUksVUFBVSxDQUFDO1FBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1FBQ3ZDLFVBQVUsR0FBRyxNQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0IsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUN2RSxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUvQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakIsQ0FBQztDQUFBLENBQUMsRUFBRSxDQUFDIn0=