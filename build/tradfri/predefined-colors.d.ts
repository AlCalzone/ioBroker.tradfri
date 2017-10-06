export interface ColorDefinition {
    /** X coordinate in the CIE color space */
    colorX: number;
    /** Y coordinate in the CIE color space */
    colorY: number;
    hue: number;
    saturation: number;
    /** Color temperature in Mired (if defined) */
    temperature?: number;
    /** RGB hex color */
    rgbHex: string;
}
export declare const predefinedColors: Map<string, ColorDefinition>;
