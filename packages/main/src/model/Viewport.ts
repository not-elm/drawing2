import type { Rect } from "../geo/Rect";

export interface Viewport extends Rect {
    x: number;
    y: number;
    scale: number;
    width: number;
    height: number;
}
