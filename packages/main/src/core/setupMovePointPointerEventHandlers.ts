import { registerLinkToRect } from "../default/mode/NewPathModeController";
import { assert } from "../lib/assert";
import { translate } from "../lib/geo/TransformMatrix";
import { adjustAngle } from "../lib/geo/adjustAngle";
import { testHitEntities } from "../lib/testHitEntities";
import type { App } from "./App";
import type { Entity } from "./Entity";
import { LinkToRect } from "./Link";
import type { CanvasPointerEvent } from "./ModeController";

export function setupMovePointPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    entity: Entity,
    nodeId: string,
) {
    app.historyManager.pause();

    const nodes = entity.getNodes();
    const edges = entity.getEdges();
    const originalNode = nodes.find((node) => node.id === nodeId);
    assert(originalNode !== undefined);

    const edge = edges.find((e) => e[0].id === nodeId || e[1].id === nodeId);
    assert(edge !== undefined);

    const otherNode = edge[0].id === nodeId ? edge[1] : edge[0];

    const oldLinkIds = app.canvasStateStore
        .getState()
        .page.links.getByEntityId(entity.props.id)
        .filter((link) => link instanceof LinkToRect)
        .filter((link) => link.nodeId === nodeId)
        .map((link) => link.id);

    app.canvasStateStore.edit((draft) => draft.deleteLinks(oldLinkIds));

    app.gestureRecognizer
        .addPointerMoveHandler(ev.pointerId, (app, ev) => {
            let newPoint = translate(
                ev.point.x - ev.startPoint.x,
                ev.point.y - ev.startPoint.y,
            ).apply(originalNode);

            if (ev.shiftKey && otherNode !== undefined) {
                newPoint = adjustAngle(otherNode, newPoint, 0, Math.PI / 12);
            }

            app.canvasStateStore.edit((draft) => {
                draft.setPointPosition(entity.props.id, nodeId, newPoint);
            });
        })
        .addPointerUpHandler(ev.pointerId, (app, ev) => {
            const hit = testHitEntities(
                app.canvasStateStore.getState().page,
                ev.point,
                app.viewportStore.getState().scale,
            );
            if (hit.entities.length > 0) {
                const { target } = hit.entities[0];

                registerLinkToRect(app, entity, originalNode, target);
            }

            app.historyManager.resume();
        });
}
