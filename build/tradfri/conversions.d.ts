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
};
