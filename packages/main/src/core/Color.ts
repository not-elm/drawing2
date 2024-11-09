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

    export function hsb(h: number, s: number, b: number): Color {
        if (h === 1) h = 0.9999;

        const max = b;
        const min = max * (1 - s);

        if (h < 1 / 6) {
            const mid = h * 6 * (max - min) + min;
            return rgb(max * 255, mid * 255, min * 255);
        } else if (h < 2 / 6) {
            const mid = (1 / 3 - h) * 6 * (max - min) + min;
            return rgb(mid * 255, max * 255, min * 255);
        } else if (h < 3 / 6) {
            const mid = (h - 1 / 3) * 6 * (max - min) + min;
            return rgb(min * 255, max * 255, mid * 255);
        } else if (h < 4 / 6) {
            const mid = (2 / 3 - h) * 6 * (max - min) + min;
            return rgb(min * 255, mid * 255, max * 255);
        } else if (h < 5 / 6) {
            const mid = (h - 2 / 3) * 6 * (max - min) + min;
            return rgb(mid * 255, min * 255, max * 255);
        } else {
            const mid = (1 - h) * 6 * (max - min) + min;
            return rgb(max * 255, min * 255, mid * 255);
        }
    }

    export function toHSB(color: Color) {
        const { r, g, b } = color;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        let hue =
            max === min
                ? 0
                : r === max
                  ? (g - b) / (6 * (max - min))
                  : g === max
                    ? (b - r) / (6 * (max - min)) + 1 / 3
                    : (r - g) / (6 * (max - min)) + 2 / 3;
        if (hue < 0) hue += 1;

        const saturation = max === 0 ? 0 : (max - min) / max;
        const brightness = max / 255;

        return { hue, saturation, brightness };
    }

    export function equals(c1: Color, c2: Color): boolean {
        return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
    }
}

export interface Color extends JSONObject {
    r: number;
    g: number;
    b: number;
    a: number;
}
