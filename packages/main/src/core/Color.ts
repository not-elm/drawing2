import type { JSONObject } from "../lib/JSONObject";

export namespace Color {
    export const Black: Color = { r: 0, g: 0, b: 0, a: 1 };
    export const Transparent: Color = { r: 0, g: 0, b: 0, a: 0 };

    export function stringify(color: Color): string {
        return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
    }

    export function rgb(r: number, g: number, b: number): Color {
        return { r, g, b, a: 1 };
    }
}

export interface Color extends JSONObject {
    r: number;
    g: number;
    b: number;
    a: number;
}
