import type { App } from "./App";
import type {
    CanvasPointerMoveEvent,
    CanvasPointerUpEvent,
} from "./GestureRecognizer";
import type { Point } from "./shape/Point";

export interface ModeControllerFactory {
    readonly type: string;
    new (app: App): ModeController;
    onRegistered?(app: App): void;
}

/**
 * Mode controller has the responsibility to handle user interactions in a specific mode.
 */
export class ModeController {
    static readonly type: string;

    onPointerMove(app: App, ev: CanvasPointerMoveEvent): void {}
    onPointerDown(app: App, ev: CanvasPointerEvent): void {}
    onPointerUp(app: App, ev: CanvasPointerUpEvent): void {}

    onContextMenu(app: App, ev: CanvasPointerEvent): void {
        app.contextMenu.show(app.viewport.get().transform.apply(ev.point));
    }
    onDoubleClick(app: App, ev: CanvasPointerEvent): void {}

    onRegistered(app: App): void {}

    onBeforeExitMode(app: App, ev: ModeChangeEvent): void {}
    onBeforeEnterMode(app: App, ev: ModeChangeEvent): void {}
    onAfterExitMode(app: App, ev: ModeChangeEvent): void {}
    onAfterEnterMode(app: App, ev: ModeChangeEvent): void {}

    onBeforeSelectedEntitiesChange(
        app: App,
        ev: SelectedEntityChangeEvent,
    ): void {}
    onAfterSelectedEntitiesChange(
        app: App,
        ev: SelectedEntityChangeEvent,
    ): void {}
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

export interface SelectedEntityChangeEvent {
    oldSelectedEntityIds: ReadonlySet<string>;
    newSelectedEntityIds: ReadonlySet<string>;
}

export interface ModeChangeEvent {
    oldMode: string;
    newMode: string;
    abort: () => void;
}
