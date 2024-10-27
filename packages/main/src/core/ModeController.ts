import type { App } from "./App";
import type { Point } from "./geo/Point";

export class ModeController {
    onRegistered(app: App): void {}
    onBeforeExitMode(app: App, ev: ModeChangeEvent): void {}
    onBeforeEnterMode(app: App, ev: ModeChangeEvent): void {}
    onAfterExitMode(app: App, ev: ModeChangeEvent): void {}
    onAfterEnterMode(app: App, ev: ModeChangeEvent): void {}
    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {}
    onContextMenu(app: App, ev: CanvasPointerEvent): void {
        app.contextMenu.show(
            app.viewportStore.getState().transform.apply(ev.point),
        );
    }
    onCanvasDoubleClick(app: App, ev: CanvasPointerEvent): void {}
    onMouseMove(app: App, point: Point): void {}
}

export interface CanvasPointerEvent {
    point: Point;
    pointerId: number;
    button: "main" | "other";
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    preventDefault: () => void;
}

export interface ModeChangeEvent {
    oldMode: string;
    newMode: string;
    abort: () => void;
}
