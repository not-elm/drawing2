import {
    type PathEntity,
    PathEntityHandle,
    isPathEntity,
} from "../../default/entity/PathEntity/PathEntity";
import { assert } from "../../lib/assert";
import type { App } from "../App";
import type { CanvasPointerUpEvent } from "../GestureRecognizer";
import {
    type CanvasPointerEvent,
    type ModeChangeEvent,
    ModeController,
    type SelectedEntityChangeEvent,
} from "../ModeController";
import type { GraphNode } from "../shape/Graph";
import { Line } from "../shape/Line";
import { Point } from "../shape/Point";
import { translate } from "../shape/TransformMatrix";
import { adjustAngle } from "../shape/adjustAngle";
import { SelectEntityModeController } from "./SelectEntityModeController";
import { SelectPathModeController } from "./SelectPathModeController";

const SnapGuideKey = "move-node.guide.snap";
const ConstraintGuideKey = "move-node.guide.constraint";

const SNAP_DISTANCE_THRESHOLD_IN_CANVAS = 16;
const EPSILON = 1e-6;

export class MoveNodeModeController extends ModeController {
    static readonly type = "move-node";

    private startPoint = new Point(0, 0);
    private originalEntity: PathEntity = null as never;
    private originalNodes = new Set<GraphNode>();
    private originalOtherNodes = new Set<GraphNode>();

    constructor(private readonly app: App) {
        super();
    }

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [MoveNodeModeController.type],
            action: () => this.abort(),
        });
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent): void {
        const originalEntity = app.canvas.selectedEntities.get()[0];
        assert(
            isPathEntity(originalEntity),
            `Invalid entity: ${originalEntity}`,
        );

        const originalGraph = PathEntityHandle.getGraph(originalEntity);

        const selectPathModeController = app.getModeControllerByClass(
            SelectPathModeController,
        );
        const selectedEdgeIds = selectPathModeController.selectedEdgeIds.get();
        const selectedNodeIds = selectPathModeController.selectedNodeIds.get();
        if (selectedEdgeIds.size === 0 && selectedNodeIds.size === 0) {
            console.warn("No node selected");
            ev.abort();
            return;
        }

        const originalNodes = new Set<GraphNode>();
        for (const nodeId of selectedNodeIds) {
            const node = originalGraph.nodes.get(nodeId);
            assert(node !== undefined, `Node not found: ${nodeId}`);
            originalNodes.add(node);
        }
        for (const edgeId of selectedEdgeIds) {
            const edge = originalGraph
                .getEdges()
                .find((edge) => edge.id === edgeId);
            assert(edge !== undefined, `Edge not found: ${edgeId}`);

            originalNodes.add(edge.p1);
            originalNodes.add(edge.p2);
        }

        const otherNodes = new Set(originalGraph.nodes.values());
        for (const node of originalNodes) {
            otherNodes.delete(node);
        }

        this.startPoint = app.pointerPosition.get();
        this.originalEntity = originalEntity;
        this.originalNodes = originalNodes;
        this.originalOtherNodes = otherNodes;
    }

    onPointerMove(app: App, ev: CanvasPointerEvent): void {
        let point = ev.point;
        let snapAxis: Axis | null = null;

        const snapResult = this.snap(ev.point);
        point = snapResult.point;
        snapAxis = snapResult.axis;

        if (ev.shiftKey) {
            point = this.applyConstraint(point, snapAxis);
        }

        this.updateConstraintGuide(point, ev.shiftKey);
        this.updateSnapGuide(point);

        const transform = translate(
            point.x - this.startPoint.x,
            point.y - this.startPoint.y,
        );

        app.canvas.edit((builder) => {
            const graph = PathEntityHandle.getGraph(this.originalEntity);
            for (const node of this.originalNodes) {
                graph.setNodePosition(node.id, transform.apply(node));
            }
            builder.setEntities([
                PathEntityHandle.setGraph(this.originalEntity, graph),
            ]);
        });
    }

    onPointerUp(app: App, ev: CanvasPointerUpEvent): void {
        const rect = app.entityHandle
            .getShape(this.originalEntity)
            .getBoundingRect();

        if (ev.isTap && rect.width === 1 && rect.height === 1) {
            app.canvas.edit((builder) => {
                builder.deleteEntity(this.originalEntity.id);
            });
        }

        app.setMode(SelectPathModeController.type);
    }

    onBeforeExitMode(app: App): void {
        this.originalEntity = null as never;
        this.originalNodes.clear();
        this.clearGuide();
    }

    onAfterSelectedEntitiesChange(app: App, ev: SelectedEntityChangeEvent) {
        this.abort();
    }

    abort() {
        this.app.canvas.edit((builder) => {
            const graph = PathEntityHandle.getGraph(this.originalEntity);
            for (const node of this.originalNodes) {
                graph.setNodePosition(node.id, node);
            }
            builder.setEntities([
                PathEntityHandle.setGraph(this.originalEntity, graph),
            ]);
        });
        this.app.setMode(SelectEntityModeController.type);
    }

    private snap(point: Point): { point: Point; axis: Axis | null } {
        const transform = translate(
            point.x - this.startPoint.x,
            point.y - this.startPoint.y,
        );

        // Signed distance to the closest snap point
        let snapDistanceX = Number.POSITIVE_INFINITY;
        let snapDistanceY = Number.POSITIVE_INFINITY;

        for (const p1 of this.originalNodes) {
            const translatedP1 = transform.apply(p1);
            for (const p2 of this.originalOtherNodes) {
                if (Math.abs(p2.x - translatedP1.x) < Math.abs(snapDistanceX)) {
                    snapDistanceX = p2.x - translatedP1.x;
                }
                if (Math.abs(p2.y - translatedP1.y) < Math.abs(snapDistanceY)) {
                    snapDistanceY = p2.y - translatedP1.y;
                }
            }
        }

        const snapDistanceThreshold =
            SNAP_DISTANCE_THRESHOLD_IN_CANVAS / this.app.viewport.get().scale;
        let snapAxis: Axis | null = null;
        if (Math.abs(snapDistanceX) < snapDistanceThreshold) {
            point = new Point(point.x + snapDistanceX, point.y);
            snapAxis = "x";
        }
        if (Math.abs(snapDistanceY) < snapDistanceThreshold) {
            point = new Point(point.x, point.y + snapDistanceY);
            if (
                snapAxis === null ||
                Math.abs(snapDistanceY) < Math.abs(snapDistanceX)
            ) {
                snapAxis = "y";
            }
        }

        return { point, axis: snapAxis };
    }

    private applyConstraint(point: Point, axis: Axis | null): Point {
        return adjustAngle(
            this.startPoint,
            point,
            0,
            Math.PI / 4,
            axis === "x" ? "keep-x" : axis === "y" ? "keep-y" : "none",
        );
    }

    private updateConstraintGuide(point: Point, active: boolean): void {
        if (active) {
            const dx = point.x - this.startPoint.x;
            const dy = point.y - this.startPoint.y;

            const points: Point[] = [];
            const lines: Line[] = [];
            for (const point of this.originalNodes) {
                const newPoint = new Point(point.x + dx, point.y + dy);
                points.push(point, newPoint);
                lines.push(new Line(point, newPoint));
            }
            this.app.setSnapGuide(ConstraintGuideKey, {
                points,
                lines,
            });
        } else {
            this.app.deleteSnapGuide(ConstraintGuideKey);
        }
    }
    private updateSnapGuide(point: Point): void {
        const transform = translate(
            point.x - this.startPoint.x,
            point.y - this.startPoint.y,
        );
        const lines: Line[] = [];

        const points: Set<Point> = new Set();
        for (const p1 of this.originalNodes) {
            const translatedP1 = transform.apply(p1);
            const pointsX: Point[] = [];
            const pointsY: Point[] = [];

            for (const p2 of this.originalOtherNodes) {
                if (Math.abs(translatedP1.y - p2.y) < EPSILON) pointsX.push(p2);
                if (Math.abs(translatedP1.x - p2.x) < EPSILON) pointsY.push(p2);
            }

            if (pointsX.length > 0) {
                pointsX.push(translatedP1);
                const minX = pointsX.reduce((min, p) =>
                    min.x < p.x ? min : p,
                );
                const maxX = pointsX.reduce((max, p) =>
                    max.x > p.x ? max : p,
                );
                lines.push(new Line(minX, maxX));
                for (const p of pointsX) points.add(p);
            }
            if (pointsY.length > 0) {
                pointsY.push(translatedP1);
                const minY = pointsY.reduce((min, p) =>
                    min.y < p.y ? min : p,
                );
                const maxY = pointsY.reduce((max, p) =>
                    max.y > p.y ? max : p,
                );
                lines.push(new Line(minY, maxY));
                for (const p of pointsY) points.add(p);
            }
        }

        this.app.setSnapGuide(SnapGuideKey, {
            points: [...points],
            lines,
        });
    }

    private clearGuide() {
        this.app.deleteSnapGuide(SnapGuideKey);
        this.app.deleteSnapGuide(ConstraintGuideKey);
    }
}

export type Axis = "x" | "y";
