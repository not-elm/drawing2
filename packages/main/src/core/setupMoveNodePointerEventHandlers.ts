import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { registerLinkToRect } from "../default/mode/NewPathModeController";
import { assert } from "../lib/assert";
import { Line } from "../lib/geo/Line";
import { Point } from "../lib/geo/Point";
import { translate } from "../lib/geo/TransformMatrix";
import {
    type AdjustAngleConstraintMode,
    adjustAngle,
} from "../lib/geo/adjustAngle";
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

export function setupMoveNodePointerEventHandlers(
    app: App,
    ev: CanvasPointerEvent,
    entity: Entity,
    nodeId: string,
) {
    app.historyManager.pause();
    assert(entity instanceof PathEntity);

    const nodes = entity.getNodes();
    const edges = entity.getEdges();
    const originalNode = nodes.find((node) => node.id === nodeId);
    assert(originalNode !== undefined);

    const edge = edges.find((e) => e[0].id === nodeId || e[1].id === nodeId);
    assert(edge !== undefined);

    const oldLinkIds = app.canvasStateStore
        .getState()
        .links.getByEntityId(entity.props.id)
        .filter((link) => link instanceof LinkToRect)
        .filter((link) => link.nodeId === nodeId)
        .map((link) => link.id);

    app.canvasStateStore.edit((draft) => draft.deleteLinks(oldLinkIds));

    app.gestureRecognizer
        .addPointerMoveHandler(
            ev.pointerId,
            getPointerMoveHandler(entity.props.id, nodeId, originalNode),
        )
        .addPointerUpHandler(
            ev.pointerId,
            getPointerUpHandler(entity.props.id, nodeId),
        );
}

function getPointerMoveHandler(
    entityId: string,
    nodeId: string,
    originalNode: GraphNode,
) {
    return (app: App, ev: CanvasPointerMoveEvent) => {
        let newPoint = translate(
            ev.point.x - ev.startPoint.x,
            ev.point.y - ev.startPoint.y,
        ).apply(originalNode);

        const entity = app.canvasStateStore.getState().entities.get(entityId);
        assert(entity !== undefined, `Entity not found: ${entityId}`);
        assert(entity instanceof PathEntity);

        const nodes = entity.getNodes();
        const targetNode = nodes.find((node) => node.id === nodeId);
        assert(targetNode !== undefined);
        const otherNodes = nodes.filter((node) => node.id !== nodeId);

        // snap
        const xSnapPoints = {
            value: 0,
            distance: Number.POSITIVE_INFINITY,
            points: [] as Point[],
        };
        const ySnapPoints = {
            value: 0,
            distance: Number.POSITIVE_INFINITY,
            points: [] as Point[],
        };
        for (const otherNode of otherNodes) {
            const distanceX = Math.abs(newPoint.x - otherNode.x);
            if (distanceX < xSnapPoints.distance) {
                xSnapPoints.value = otherNode.x;
                xSnapPoints.distance = distanceX;
                xSnapPoints.points = [otherNode];
            } else if (distanceX === xSnapPoints.distance) {
                xSnapPoints.points.push(otherNode);
            }

            const distanceY = Math.abs(newPoint.y - otherNode.y);
            if (distanceY < ySnapPoints.distance) {
                ySnapPoints.value = otherNode.y;
                ySnapPoints.distance = distanceY;
                ySnapPoints.points = [otherNode];
            } else if (distanceY === ySnapPoints.distance) {
                ySnapPoints.points.push(otherNode);
            }
        }
        if (xSnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
            newPoint = new Point(xSnapPoints.points[0].x, newPoint.y);
        }
        if (ySnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
            newPoint = new Point(newPoint.x, ySnapPoints.points[0].y);
        }

        // constraint
        if (ev.shiftKey) {
            let constraintMode: AdjustAngleConstraintMode;
            if (
                xSnapPoints.distance < SNAP_DISTANCE_THRESHOLD &&
                ySnapPoints.distance < SNAP_DISTANCE_THRESHOLD
            ) {
                if (xSnapPoints.distance < ySnapPoints.distance) {
                    constraintMode = "keep-x";
                } else {
                    constraintMode = "keep-y";
                }
            } else if (xSnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
                constraintMode = "keep-x";
            } else if (ySnapPoints.distance < SNAP_DISTANCE_THRESHOLD) {
                constraintMode = "keep-y";
            } else {
                constraintMode = "none";
            }

            newPoint = adjustAngle(
                originalNode,
                newPoint,
                0,
                Math.PI / 4,
                constraintMode,
            );
        }

        // snap guide
        if (ev.shiftKey) {
            app.snapGuideStore.setSnapGuide(SNAP_GUIDE_KEY_ANGLE, {
                points: [originalNode, newPoint],
                lines: [new Line({ p1: originalNode, p2: newPoint })],
            });
        } else {
            app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_KEY_ANGLE);
        }
        if (newPoint.x === xSnapPoints.value) {
            const points = [newPoint, ...xSnapPoints.points];
            const yMin = Math.min(...points.map((p) => p.y));
            const yMax = Math.max(...points.map((p) => p.y));
            app.snapGuideStore.setSnapGuide(SNAP_GUIDE_X_AXIS, {
                points: [newPoint, ...xSnapPoints.points],
                lines: [
                    new Line({
                        p1: new Point(newPoint.x, yMin),
                        p2: new Point(newPoint.x, yMax),
                    }),
                ],
            });
        } else {
            app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_X_AXIS);
        }
        if (newPoint.y === ySnapPoints.value) {
            const points = [newPoint, ...ySnapPoints.points];
            const xMin = Math.min(...points.map((p) => p.x));
            const xMax = Math.max(...points.map((p) => p.x));
            app.snapGuideStore.setSnapGuide(SNAP_GUIDE_Y_AXIS, {
                points: [newPoint, ...ySnapPoints.points],
                lines: [
                    new Line({
                        p1: new Point(xMin, newPoint.y),
                        p2: new Point(xMax, newPoint.y),
                    }),
                ],
            });
        } else {
            app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_Y_AXIS);
        }

        app.canvasStateStore.edit((draft) => {
            draft.setPointPosition(entity.props.id, nodeId, newPoint);
        });
    };
}

function getPointerUpHandler(entityId: string, nodeId: string) {
    return (app: App, ev: CanvasPointerEvent) => {
        const entity = app.canvasStateStore.getState().entities.get(entityId);
        assert(entity !== undefined, `Entity not found: ${entityId}`);
        assert(entity instanceof PathEntity);

        const nodes = entity.getNodes();
        const targetNode = nodes.find((node) => node.id === nodeId);
        assert(targetNode !== undefined);
        const otherNodes = nodes.filter((node) => node.id !== nodeId);

        // Merge overlap nodes
        const overlappedNodes: GraphNode[] = [];
        for (const otherNode of otherNodes) {
            const distance = Math.hypot(
                otherNode.x - ev.point.x,
                otherNode.y - ev.point.y,
            );
            if (distance < OVERLAP_NODE_THRESHOLD) {
                overlappedNodes.push(otherNode);
            }
        }
        if (overlappedNodes.length > 0) {
            const graph = entity.graph.clone();
            for (const overlappedNode of overlappedNodes) {
                graph.mergeNodes(overlappedNode.id, nodeId);
            }
            const newEntity = new PathEntity(entity.props, graph);
            app.canvasStateStore.edit((draft) => {
                draft.setEntities([newEntity]);
            });
        }

        // Link to other entity
        const hit = testHitEntities(
            app.canvasStateStore.getState(),
            ev.point,
            app.viewportStore.getState().scale,
        );
        if (hit.entities.length > 0) {
            const { target } = hit.entities[0];

            registerLinkToRect(app, entity, targetNode, target);
        }

        app.historyManager.resume();
        app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_KEY_ANGLE);
        app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_X_AXIS);
        app.snapGuideStore.deleteSnapGuide(SNAP_GUIDE_Y_AXIS);
    };
}
