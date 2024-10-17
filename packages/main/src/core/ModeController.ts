import type { Point } from "../lib/geo/Point";
import type { App } from "./App";

export interface Mode {
    type: string;

    [key: string]: unknown;
}

export class ModeController {
    onBeforeExitMode(app: App, ev: ModeChangeEvent): void {}
    onBeforeEnterMode(app: App, ev: ModeChangeEvent): void {}
    onAfterExitMode(app: App, ev: ModeChangeEvent): void {}
    onAfterEnterMode(app: App, ev: ModeChangeEvent): void {}
    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {}
    onCanvasDoubleClick(app: App, ev: CanvasPointerEvent): void {}
    onMouseMove(app: App, point: Point): void {}
}

export interface CanvasPointerEvent {
    point: Point;
    pointerId: number;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    preventDefault: () => void;
}

export interface ModeChangeEvent {
    oldMode: Mode;
    newMode: Mode;
    abort: () => void;
}
