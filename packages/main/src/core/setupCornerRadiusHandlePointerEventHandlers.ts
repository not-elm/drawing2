import {
    PROPERTY_KEY_CORNER_RADIUS,
    type PathEntity,
    PathEntityHandle,
    isPathEntity,
} from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import type { App } from "./App";
import type { CanvasPointerMoveEvent } from "./GestureRecognizer";
import type { CanvasPointerEvent } from "./ModeController";
import {
    type CornerRoundHandleData,
    getMaxCornerRadius,
} from "./mode/SelectEntityModeController";

export function setupCornerRadiusHandlePointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    entity: PathEntity,
    handle: CornerRoundHandleData,
) {
    app.history.addCheckpoint();

    const dx = handle.handlePosition.x - handle.node.x;
    const dy = handle.handlePosition.y - handle.node.y;
    const norm = Math.hypot(dx, dy);
    const ix = dx / norm;
    const iy = dy / norm;

    app.gesture.addPointerMoveHandlerForPointer(
        ev.pointerId,
        getPointerMoveHandler(
            entity.id,
            ix,
            iy,
            app.entityHandle.getProperty(entity, PROPERTY_KEY_CORNER_RADIUS, 0),
            handle.cornerAngle,
        ),
    );
}

function getPointerMoveHandler(
    entityId: string,
    ix: number,
    iy: number,
    originalValue: number,
    cornerAngle: number,
) {
    return (app: App, ev: CanvasPointerMoveEvent) => {
        const entity = app.canvas.page.get().entities.get(entityId);
        assert(entity !== undefined, `entity not found: ${entityId}`);
        assert(isPathEntity(entity));
        const maxValue = getMaxCornerRadius(
            PathEntityHandle.getGraph(entity).getOutline().points,
        );

        const dx = ev.point.x - ev.startPoint.x;
        const dy = ev.point.y - ev.startPoint.y;
        const diffHandle = ix * dx + iy * dy;
        const diffRadius = diffHandle * Math.sin(cornerAngle / 2);

        const value = Math.min(
            Math.max(0, originalValue + diffRadius),
            maxValue,
        );

        app.canvas.edit((builder) => {
            builder.updateProperty(
                [entityId],
                PROPERTY_KEY_CORNER_RADIUS,
                value,
            );
        });
    };
}
