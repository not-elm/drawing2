import {
    PROPERTY_KEY_CORNER_RADIUS,
    type PathEntity,
} from "../default/entity/PathEntity/PathEntity";
import type { Point } from "../lib/geo/Point";
import type { App } from "./App";
import type { CanvasPointerMoveEvent } from "./GestureRecognizer";
import type { CanvasPointerEvent } from "./ModeController";

export function setupCornerRadiusHandlePointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    entity: PathEntity,
    origin: Point,
) {
    app.historyManager.pause();

    const dx = ev.point.x - origin.x;
    const dy = ev.point.y - origin.y;
    const norm = Math.hypot(dx, dy);
    const ix = dx / norm;
    const iy = dy / norm;

    app.gestureRecognizer
        .addPointerMoveHandler(
            ev.pointerId,
            getPointerMoveHandler(
                entity.props.id,
                ix,
                iy,
                entity.getProperty(PROPERTY_KEY_CORNER_RADIUS, 0),
            ),
        )
        .addPointerUpHandler(ev.pointerId, getPointerUpHandler());
}

function getPointerMoveHandler(
    entityId: string,
    ix: number,
    iy: number,
    originalValue: number,
) {
    return (app: App, ev: CanvasPointerMoveEvent) => {
        const dx = ev.point.x - ev.startPoint.x;
        const dy = ev.point.y - ev.startPoint.y;
        const value = Math.max(0, originalValue + ix * dx + iy * dy);

        app.canvasStateStore.edit((draft) => {
            draft.updateProperty([entityId], PROPERTY_KEY_CORNER_RADIUS, value);
        });
    };
}

function getPointerUpHandler() {
    return (app: App, ev: CanvasPointerEvent) => {
        app.historyManager.resume();
    };
}
