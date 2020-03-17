/// <reference types="iobroker" />
export interface ExtendedAdapter extends ioBroker.Adapter {
    __isExtended: boolean;
    createOwnStateAsync(id: string, initialValue: any, ack?: boolean, commonType?: ioBroker.CommonType): Promise<void>;
    createOwnStateExAsync(id: string, obj: ioBroker.Object, initialValue: any, ack?: boolean): Promise<void>;
}
export declare class Global {
    private static _adapter;
    static get adapter(): ExtendedAdapter;
    static set adapter(adapter: ExtendedAdapter);
    static extend(adapter: ioBroker.Adapter): ExtendedAdapter;
    static log(message: string, level?: ioBroker.LogLevel): void;
    /**
     * Kurzschreibweise für die Ermittlung eines Objekts
     * @param id
     */
    static $(id: string): Promise<ioBroker.Object | null | undefined>;
    /**
     * Kurzschreibweise für die Ermittlung mehrerer Objekte
     * @param id
     */
    static $$(pattern: string, type: ioBroker.ObjectType, role?: string): Promise<Record<string, ioBroker.Object>>;
}
