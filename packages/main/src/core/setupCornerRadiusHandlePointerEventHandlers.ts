import {
    PROPERTY_KEY_CORNER_RADIUS,
    PathEntity,
} from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import type { App } from "./App";
import type { CanvasPointerMoveEvent } from "./GestureRecognizer";
import type { CanvasPointerEvent } from "./ModeController";
import {
    type CornerRoundHandleData,
    getMaxCornerRadius,
} from "./SelectEntityModeController";

export function setupCornerRadiusHandlePointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    entity: PathEntity,
    handle: CornerRoundHandleData,
) {
    app.historyManager.pause();

    const dx = handle.handlePosition.x - handle.node.x;
    const dy = handle.handlePosition.y - handle.node.y;
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
                handle.cornerAngle,
            ),
        )
        .addPointerUpHandler(ev.pointerId, getPointerUpHandler());
}

function getPointerMoveHandler(
    entityId: string,
    ix: number,
    iy: number,
    originalValue: number,
    cornerAngle: number,
) {
    return (app: App, ev: CanvasPointerMoveEvent) => {
        const entity = app.canvasStateStore.getState().entities.get(entityId);
        assert(entity !== undefined, `entity not found: ${entityId}`);
        assert(entity instanceof PathEntity);
        const maxValue = getMaxCornerRadius(entity.graph.getOutline());

        const dx = ev.point.x - ev.startPoint.x;
        const dy = ev.point.y - ev.startPoint.y;
        const diffHandle = ix * dx + iy * dy;
        const diffRadius = diffHandle * Math.sin(cornerAngle / 2);

        const value = Math.min(
            Math.max(0, originalValue + diffRadius),
            maxValue,
        );

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
