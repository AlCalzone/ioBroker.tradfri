declare namespace ioBroker {
	interface AdapterConfig {
		discoverGateway: boolean;
		host: string;
		securityCode: string;
		identity: string;
		psk: string;
		preserveTransitionTime: boolean;
		roundToDigits: number;
	}
}
