import { native } from "../io-package.json";

type _AdapterConfig = typeof native;

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		// tslint:disable-next-line:no-empty-interface
		interface AdapterConfig extends _AdapterConfig {

		}
	}
}
