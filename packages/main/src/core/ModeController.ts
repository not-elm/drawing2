import type { Point } from "../lib/geo/Point";
import type { Entity } from "./Entity";
import type { Mode } from "./Mode";

export abstract class ModeController {
    abstract getType(): string;

    onBeforeExitMode(ev: ModeChangeEvent): void {}
    onBeforeEnterMode(ev: ModeChangeEvent): void {}
    onAfterExitMode(ev: ModeChangeEvent): void {}
    onAfterEnterMode(ev: ModeChangeEvent): void {}

    onCanvasPointerDown(data: PointerDownEvent): void {}
    onCanvasDoubleClick(data: PointerDownEvent): void {}
    onEntityPointerDown(data: PointerDownEvent, entity: Entity): void {}
    onMouseMove(point: Point): void {}
}

export interface PointerDownEvent {
    point: Point;
    pointerId: number;
    shiftKey: boolean;
    preventDefault: () => void;
}

export interface ModeChangeEvent {
    oldMode: Mode;
    newMode: Mode;
    abort: () => void;
}
