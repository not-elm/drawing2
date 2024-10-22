import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { registerLinkToRect } from "../default/mode/NewPathModeController";
import { assert } from "../lib/assert";
import { translate } from "../lib/geo/TransformMatrix";
import { isNotNullish } from "../lib/isNullish";
import { testHitEntities } from "../lib/testHitEntities";
import type { App } from "./App";
import type { Entity } from "./Entity";
import type { CanvasPointerMoveEvent } from "./GestureRecognizer";
import type { GraphNode } from "./Graph";
import { LinkToRect } from "./Link";
import type { CanvasPointerEvent } from "./ModeController";

const OVERLAP_NODE_THRESHOLD = 8;
const SNAP_DISTANCE_THRESHOLD = 8;
const SNAP_GUIDE_KEY_ANGLE = "editPath-angle";
const SNAP_GUIDE_X_AXIS = "editPath-xAxis";
const SNAP_GUIDE_Y_AXIS = "editPath-yAxis";

export function setupMoveNodesPointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    entity: Entity,
    nodeIds: string[],
) {
    app.historyManager.pause();
    assert(entity instanceof PathEntity);

    const originalNodes = nodeIds
        .map((nodeId) => entity.getNodeById(nodeId))
        .filter(isNotNullish);

    const oldLinkIds = app.canvasStateStore
        .getState()
        .page.links.getByEntityId(entity.props.id)
        .filter((link) => link instanceof LinkToRect)
        .filter((link) => nodeIds.includes(link.nodeId))
        .map((link) => link.id);

    app.canvasStateStore.edit((draft) => draft.deleteLinks(oldLinkIds));

    app.gestureRecognizer
        .addPointerMoveHandler(
            ev.pointerId,
            getPointerMoveHandler(entity.props.id, nodeIds, originalNodes),
        )
        .addPointerUpHandler(
            ev.pointerId,
            getPointerUpHandler(entity.props.id, nodeIds),
        );
}

function getPointerMoveHandler(
    entityId: string,
    nodeIds: string[],
    originalNodes: GraphNode[],
) {
    return (app: App, ev: CanvasPointerMoveEvent) => {
        const transform = translate(
            ev.point.x - ev.startPoint.x,
            ev.point.y - ev.startPoint.y,
        );

        const entity = app.canvasStateStore
            .getState()
            .page.entities.get(entityId);
        assert(entity !== undefined, `Entity not found: ${entityId}`);
        assert(entity instanceof PathEntity);

        const nodes = entity.getNodes();

        // // snap
        // const xSnapPoints = {
        //     value: 0,
        //     distance: Number.POSITIVE_INFINITY,
        //     points: [] as Point[],
        // };
        // const ySnapPoints = {
        //     value: 0,
        //     distance: Number.POSITIVE_INFINITY,
        //     points: [] as Point[],
        // };
        // const otherNodes = nodes.filter((node) => node.id !== nodeId);
        // for (const otherNode of otherNodes) {
        //     const distanceX = Math.abs(newPoint.x - otherNode.x);
        //     if (distanceX < xSnapPoints.distance) {
        //         xSnapPoints.value = otherNode.x;
        //         xSnapPoints.distance = distanceX;
        //         xSnapPoints.points = [otherNode];
        //     } else if (distanceX === xSnapPoints.distance) {
        //         xSnapPoints.points.push(otherNode);
        //     }
        //
        //     const distanceY = Math.abs(newPoint.y - otherNode.y);
        //     if (distanceY < ySnapPoints.distance) {
        //         ySnapPoints.value = otherNode.y;
        //         ySnapPoints.distance = distanceY;
        //         ySnapPoints.points = [otherNode];
        //     } else if (distanceY === ySnapPoints.distance) {
        //         ySnapPoints.points.push(otherNode);
        //     }
        // }
        // if (xSnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
        //     newPoint = new Point(xSnapPoints.points[0].x, newPoint.y);
        // }
        // if (ySnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
        //     newPoint = new Point(newPoint.x, ySnapPoints.points[0].y);
        // }
        //
        // // constraint
        // if (ev.shiftKey) {
        //     let constraintMode: AdjustAngleConstraintMode;
        //     if (
        //         xSnapPoints.distance < SNAP_DISTANCE_THRESHOLD &&
        //         ySnapPoints.distance < SNAP_DISTANCE_THRESHOLD
        //     ) {
        //         if (xSnapPoints.distance < ySnapPoints.distance) {
        //             constraintMode = "keep-x";
        //         } else {
        //             constraintMode = "keep-y";
        //         }
        //     } else if (xSnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
        //         constraintMode = "keep-x";
        //     } else if (ySnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
        //         constraintMode = "keep-y";
        //     } else {
        //         constraintMode = "none";
        //     }
        //
        //     newPoint = adjustAngle(
        //         originalNode,
        //         newPoint,
        //         0,
        //         Math.PI / 4,
        //         constraintMode,
        //     );
        // }
        //
        // // snap guide
        // if (ev.shiftKey) {
        //     app.snapGuideStore.setSnapGuide(SNAP_GUIDE_KEY_ANGLE, {
        //         points: [originalNode, newPoint],
        //         lines: [new Line({ p1: originalNode, p2: newPoint })],
        //     });
        // } else {
        //     app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_KEY_ANGLE);
        // }
        // if (newPoint.x === xSnapPoints.value) {
        //     const points = [newPoint, ...xSnapPoints.points];
        //     const yMin = Math.min(...points.map((p) => p.y));
        //     const yMax = Math.max(...points.map((p) => p.y));
        //     app.snapGuideStore.setSnapGuide(SNAP_GUIDE_X_AXIS, {
        //         points: [newPoint, ...xSnapPoints.points],
        //         lines: [
        //             new Line({
        //                 p1: new Point(newPoint.x, yMin),
        //                 p2: new Point(newPoint.x, yMax),
        //             }),
        //         ],
        //     });
        // } else {
        //     app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_X_AXIS);
        // }
        // if (newPoint.y === ySnapPoints.value) {
        //     const points = [newPoint, ...ySnapPoints.points];
        //     const xMin = Math.min(...points.map((p) => p.x));
        //     const xMax = Math.max(...points.map((p) => p.x));
        //     app.snapGuideStore.setSnapGuide(SNAP_GUIDE_Y_AXIS, {
        //         points: [newPoint, ...ySnapPoints.points],
        //         lines: [
        //             new Line({
        //                 p1: new Point(xMin, newPoint.y),
        //                 p2: new Point(xMax, newPoint.y),
        //             }),
        //         ],
        //     });
        // } else {
        //     app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_Y_AXIS);
        // }

        app.canvasStateStore.edit((draft) => {
            for (const originalNode of originalNodes) {
                draft.setPointPosition(
                    entity.props.id,
                    originalNode.id,
                    transform.apply(originalNode),
                );
            }
        });
    };
}

function getPointerUpHandler(entityId: string, nodeIds: string[]) {
    return (app: App, ev: CanvasPointerEvent) => {
        const entity = app.canvasStateStore
            .getState()
            .page.entities.get(entityId);
        assert(entity !== undefined, `Entity not found: ${entityId}`);
        assert(entity instanceof PathEntity);

        const overlappedNodePairs: [GraphNode, GraphNode][] = [];

        for (const nodeId of nodeIds) {
            const nodes = entity.getNodes();
            const targetNode = nodes.find((node) => node.id === nodeId);
            assert(targetNode !== undefined);
            const otherNodes = nodes.filter((node) => node.id !== nodeId);

            // Merge overlap nodes
            for (const otherNode of otherNodes) {
                const distance = Math.hypot(
                    otherNode.x - ev.point.x,
                    otherNode.y - ev.point.y,
                );
                if (distance < OVERLAP_NODE_THRESHOLD) {
                    overlappedNodePairs.push([otherNode, targetNode]);
                }
            }
            if (overlappedNodePairs.length > 0) {
                const graph = entity.graph.clone();
                for (const [otherNode, targetNode] of overlappedNodePairs) {
                    graph.mergeNodes(otherNode.id, targetNode.id);
                }
                const newEntity = new PathEntity(entity.props, graph);
                app.canvasStateStore.edit((draft) => {
                    draft.setEntities([newEntity]);
                });
            }
        }

        // Link to other entity
        if (nodeIds.length === 1) {
            const targetNode = entity
                .getNodes()
                .find((node) => node.id === nodeIds[0]);
            assert(targetNode !== undefined, `Node not found: ${nodeIds[0]}`);

            const hit = testHitEntities(
                app.canvasStateStore.getState().page,
                ev.point,
                app.viewportStore.getState().scale,
            );
            if (hit.entities.length > 0) {
                const { target } = hit.entities[0];

                registerLinkToRect(app, entity, targetNode, target);
            }
        }

        app.historyManager.resume();
        app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_KEY_ANGLE);
        app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_X_AXIS);
        app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_Y_AXIS);
    };
}
