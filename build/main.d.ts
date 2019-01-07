/// <reference types="iobroker" />
import { ExtendedAdapter } from "./lib/global";
declare function startAdapter(options?: Partial<ioBroker.AdapterOptions>): ExtendedAdapter;
declare const _default: (isCompactMode: boolean) => typeof startAdapter | undefined;
export = _default;
