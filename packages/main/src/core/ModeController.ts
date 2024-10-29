import type { Property } from "csstype";
import type { App } from "./App";
import type { Point } from "./shape/Point";

export class ModeController {
    static readonly type: string;

    /**
     * Returns the mouse cursor type. Any CSS cursor type is allowed.
     */
    getCursor(app: App): Property.Cursor {
        return "default";
    }

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
    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {}
    onContextMenu(app: App, ev: CanvasPointerEvent): void {
        app.contextMenu.show(app.viewport.get().transform.apply(ev.point));
    }
    onCanvasDoubleClick(app: App, ev: CanvasPointerEvent): void {}
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
