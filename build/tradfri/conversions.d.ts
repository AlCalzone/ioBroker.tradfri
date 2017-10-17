import { PropertyTransform } from "../ipso/ipsoObject";
export declare const serializers: {
    transitionTime: PropertyTransform;
    hue: PropertyTransform;
    saturation: PropertyTransform;
};
export declare const deserializers: {
    transitionTime: PropertyTransform;
    hue: PropertyTransform;
    saturation: PropertyTransform;
};
export declare const conversions: {
    whiteSpectrumToColorX: PropertyTransform;
    whiteSpectrumFromColorX: PropertyTransform;
    rgbFromCIExy: (x: number, y: number) => {
        r: number;
        g: number;
        b: number;
    };
    rgbToCIExy: (r: number, g: number, b: number) => {
        x: number;
        y: number;
    };
    rgbFromHSV: (h: number, s: number, v: number) => {
        r: number;
        g: number;
        b: number;
    };
    rgbToHSV: (r: number, g: number, b: number) => {
        h: number;
        s: number;
        v: number;
    };
    rgbToString: (r: number, g: number, b: number) => string;
    rgbFromString: (rgb: string) => {
        r: number;
        g: number;
        b: number;
    };
};
