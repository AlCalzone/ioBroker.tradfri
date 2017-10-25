export interface Group {
    id: string;
    name: string;
    deviceIDs: number[];
    type: "real" | "virtual";
}
