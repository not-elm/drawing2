import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import type { CanvasPointerMoveEvent } from "../../core/GestureRecognizer";
import { LinkToEdge, LinkToRect } from "../../core/Link";
import {
    type CanvasPointerEvent,
    type ModeChangeEvent,
    ModeController,
} from "../../core/ModeController";
import type { Page } from "../../core/Page";
import { cell } from "../../core/cell/ICell";
import type { Axis } from "../../core/mode/MoveNodeModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { SelectPathModeController } from "../../core/mode/SelectPathModeController";
import { GraphNode } from "../../core/shape/Graph";
import { Line } from "../../core/shape/Line";
import { Point } from "../../core/shape/Point";
import { adjustAngle } from "../../core/shape/adjustAngle";
import { assert } from "../../lib/assert";
import { randomId } from "../../lib/randomId";
import {
    PROPERTY_KEY_ARROW_HEAD_NODE_IDS,
    PROPERTY_KEY_CORNER_RADIUS,
    type PathEntity,
    PathEntityHandle,
} from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

interface ControlLayerData {
    nodes: GraphNode[];
    lastNodePosition: Point | null;
    pointerPosition: Point;
}

const SnapGuideKey = "new-path.guide.snap";
const ConstraintGuideKey = "new-path.guide.constraint";

const SNAP_DISTANCE_THRESHOLD_IN_CANVAS = 16;
const EPSILON = 1e-6;

export class NewPathModeController extends ModeController {
    static readonly type = "new-path";
    private pathEntity: PathEntity | null = null;
    private lastNodeId: string | null = null;
    public readonly controlLayerData = cell<ControlLayerData>({
        nodes: [],
        lastNodePosition: null,
        pointerPosition: new Point(0, 0),
    });

    constructor(private readonly app: App) {
        super();
    }

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [NewPathModeController.type],
            action: (app, ev) => {
                if (this.pathEntity === null) {
                    app.setMode(SelectEntityModeController.type);
                } else {
                    app.canvas.setSelectedEntityIds([this.pathEntity.id]);
                    app.setMode(SelectPathModeController.type);
                }
            },
        });
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent) {
        if (ev.oldMode !== SelectPathModeController.type) {
            this.pathEntity = null;
        } else {
            this.pathEntity =
                SelectPathModeController.getSelectedSinglePathEntityOrNull(app);
        }

        this.lastNodeId = null;
    }

    onAfterEnterMode(app: App, ev: ModeChangeEvent) {
        app.cursor.set("crosshair");
    }

    private findNodeByPoint(point: Point): GraphNode | null {
        if (this.pathEntity === null) return null;

        const graph = PathEntityHandle.getGraph(this.pathEntity);
        for (const node of graph.nodes.values()) {
            if (
                Math.abs(node.x - point.x) < EPSILON &&
                Math.abs(node.y - point.y) < EPSILON
            ) {
                return node;
            }
        }
        return null;
    }

    onPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.history.pause();

        const point = this.applySnapAndConstraint(ev.point, ev);
        const overlappedNode = this.findNodeByPoint(point);

        if (overlappedNode === null) {
            this.insertNewNode(this.app, point);
        } else if (this.lastNodeId === null) {
            // Path creation is just started with existing node.
            this.lastNodeId = overlappedNode.id;
        } else {
            // At-least one node is already created.
            assert(this.pathEntity !== null);
            const graph = PathEntityHandle.getGraph(this.pathEntity);
            const lastNode = graph.nodes.get(this.lastNodeId);
            assert(lastNode !== undefined);

            if (lastNode.id !== overlappedNode.id) {
                graph.addEdge(lastNode, overlappedNode);
                const newEntity = PathEntityHandle.setGraph(
                    this.pathEntity,
                    graph,
                );
                this.app.canvas.edit((builder) => builder.setEntity(newEntity));
                this.pathEntity = newEntity;
            }

            // Start creating a new path
            this.lastNodeId = null;
        }

        app.history.resume();
    }

    onPointerMove(app: App, ev: CanvasPointerMoveEvent) {
        this.updateControlLayerData(app, ev);
    }

    onBeforeExitMode(app: App): void {
        this.clearGuide();
    }
    private applySnapAndConstraint(
        point: Point,
        ev: CanvasPointerEvent,
    ): Point {
        let snapAxis: Axis | null = null;

        const snapResult = this.snap(ev.point);
        point = snapResult.point;
        snapAxis = snapResult.axis;

        if (ev.shiftKey) {
            point = this.applyConstraint(point, snapAxis);
        }

        this.updateConstraintGuide(point, ev.shiftKey);
        this.updateSnapGuide(point);

        return point;
    }

    private snap(point: Point): { point: Point; axis: Axis | null } {
        if (this.pathEntity === null) return { point, axis: null };

        // Signed distance to the closest snap point
        let snapDistanceX = Number.POSITIVE_INFINITY;
        let snapDistanceY = Number.POSITIVE_INFINITY;

        const graph = PathEntityHandle.getGraph(this.pathEntity);

        for (const p2 of graph.nodes.values()) {
            if (Math.abs(p2.x - point.x) < Math.abs(snapDistanceX)) {
                snapDistanceX = p2.x - point.x;
            }
            if (Math.abs(p2.y - point.y) < Math.abs(snapDistanceY)) {
                snapDistanceY = p2.y - point.y;
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
        if (this.lastNodeId === null) return point;
        assert(this.pathEntity !== null);

        const lastNode = PathEntityHandle.getGraph(this.pathEntity).nodes.get(
            this.lastNodeId,
        );
        assert(lastNode !== undefined);

        return adjustAngle(
            lastNode,
            point,
            0,
            Math.PI / 4,
            axis === "x" ? "keep-x" : axis === "y" ? "keep-y" : "none",
        );
    }

    private insertNewNode(app: App, point: Point): GraphNode {
        const newNode = new GraphNode(randomId(), point);

        if (this.pathEntity === null) {
            this.pathEntity = createEmptyPathEntity(app);
        }
        const graph = PathEntityHandle.getGraph(this.pathEntity).clone();
        graph.addNode(newNode);

        if (this.lastNodeId !== null) {
            const lastNode = graph.nodes.get(this.lastNodeId);
            assert(lastNode !== undefined);
            graph.addEdge(lastNode, newNode);
        }

        const newEntity = PathEntityHandle.setGraph(this.pathEntity, graph);
        app.canvas.edit((builder) => builder.setEntity(newEntity));
        this.pathEntity = newEntity;
        this.lastNodeId = newNode.id;

        return newNode;
    }

    private updateControlLayerData(app: App, ev: CanvasPointerEvent) {
        if (this.pathEntity === null) {
            this.controlLayerData.set({
                nodes: [],
                lastNodePosition: null,
                pointerPosition: ev.point,
            });
            return;
        }

        const graph = PathEntityHandle.getGraph(this.pathEntity);

        const pointerPosition = this.applySnapAndConstraint(ev.point, ev);
        this.controlLayerData.set({
            nodes: Array.from(graph.nodes.values()),
            lastNodePosition:
                this.lastNodeId === null
                    ? null
                    : graph.nodes.get(this.lastNodeId) ?? null,
            pointerPosition,
        });
    }

    private updateConstraintGuide(point: Point, active: boolean): void {
        if (this.pathEntity === null || this.lastNodeId === null) {
            this.app.deleteSnapGuide(ConstraintGuideKey);
            return;
        }

        if (active) {
            const points: Point[] = [];
            const lines: Line[] = [];

            const graph = PathEntityHandle.getGraph(this.pathEntity);
            const lastPoint = graph.nodes.get(this.lastNodeId);
            assert(lastPoint !== undefined);

            points.push(lastPoint, point);
            lines.push(new Line(lastPoint, point));

            this.app.setSnapGuide(ConstraintGuideKey, {
                points,
                lines,
            });
        } else {
            this.app.deleteSnapGuide(ConstraintGuideKey);
        }
    }

    private updateSnapGuide(point: Point): void {
        if (this.pathEntity === null) {
            this.app.deleteSnapGuide(SnapGuideKey);
            return;
        }

        const graph = PathEntityHandle.getGraph(this.pathEntity);

        const lines: Line[] = [];
        const points: Set<Point> = new Set();

        const pointsX: Point[] = [];
        const pointsY: Point[] = [];

        for (const p2 of graph.nodes.values()) {
            if (Math.abs(point.y - p2.y) < EPSILON) pointsX.push(p2);
            if (Math.abs(point.x - p2.x) < EPSILON) pointsY.push(p2);
        }

        if (pointsX.length > 0) {
            pointsX.push(point);
            const minX = pointsX.reduce((min, p) => (min.x < p.x ? min : p));
            const maxX = pointsX.reduce((max, p) => (max.x > p.x ? max : p));
            lines.push(new Line(minX, maxX));
            for (const p of pointsX) points.add(p);
        }
        if (pointsY.length > 0) {
            pointsY.push(point);
            const minY = pointsY.reduce((min, p) => (min.y < p.y ? min : p));
            const maxY = pointsY.reduce((max, p) => (max.y > p.y ? max : p));
            lines.push(new Line(minY, maxY));
            for (const p of pointsY) points.add(p);
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

export function createEmptyPathEntity(app: App): PathEntity {
    return {
        id: randomId(),
        type: "path",
        nodes: [],
        edges: [],
        [PROPERTY_KEY_COLOR_ID]: app.getSelectedPropertyValue(
            PROPERTY_KEY_COLOR_ID,
            0,
        ),
        [PROPERTY_KEY_STROKE_STYLE]: app.getSelectedPropertyValue(
            PROPERTY_KEY_STROKE_STYLE,
            "solid",
        ),
        [PROPERTY_KEY_STROKE_WIDTH]: app.getSelectedPropertyValue(
            PROPERTY_KEY_STROKE_WIDTH,
            2,
        ),
        [PROPERTY_KEY_FILL_STYLE]: app.getSelectedPropertyValue(
            PROPERTY_KEY_FILL_STYLE,
            "none",
        ),
        [PROPERTY_KEY_CORNER_RADIUS]: 0,
        [PROPERTY_KEY_ARROW_HEAD_NODE_IDS]: [],
    };
}

export function registerLinkToRect(
    app: App,
    nodeOwner: Entity,
    node: GraphNode,
    target: Entity,
) {
    if (nodeOwner.id === target.id) {
        return;
    }
    if (isOwnedLabel(app.canvas.page.get(), nodeOwner, target)) {
        return;
    }

    app.canvas.edit((builder) =>
        builder.addLink(
            new LinkToRect(randomId(), nodeOwner.id, node.id, target.id),
        ),
    );
}

function isOwnedLabel(page: Page, nodeOwner: Entity, label: Entity): boolean {
    return page.links
        .getByEntityId(nodeOwner.id)
        .some(
            (link) => link instanceof LinkToEdge && link.entityId === label.id,
        );
}
