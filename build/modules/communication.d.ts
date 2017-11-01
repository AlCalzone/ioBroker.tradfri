export interface Group {
    id: string;
    name: string;
    deviceIDs: number[];
    type: "real" | "virtual";
}
export interface Device {
    id: string;
    name: string;
    type: "lightbulb";
}
