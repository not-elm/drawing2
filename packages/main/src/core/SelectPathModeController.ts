import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import { Line } from "../lib/geo/Line";
import { Point } from "../lib/geo/Point";
import { randomId } from "../lib/randomId";
import type { App } from "./App";
import { type GraphEdge, GraphNode } from "./Graph";
import {
    type CanvasPointerEvent,
    type Mode,
    ModeController,
} from "./ModeController";
import { createSelectEntityMode } from "./SelectEntityModeController";
import { SelectPathModeStateStore } from "./SelectPathModeStateStore";
import { setupMoveNodesPointerEventHandlers } from "./setupMoveNodesPointerEventHandlers";

const NODE_CONTROL_HIT_AREA_RADIUS = 16;
const EDGE_CONTROL_HIT_AREA_WIDTH = 16;

export class SelectPathModeController extends ModeController {
    readonly store = new SelectPathModeStateStore();

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: ["select-path"],
            action: (app, ev) => {
                const mode = app.appStateStore.getState().mode;
                assert(isSelectPathMode(mode), `Invalid mode: ${mode.type}`);
                app.setMode(createSelectEntityMode(new Set(mode.entityId)));
            },
        });
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const control = this.getControlByPoint(app, ev.point);
        if (control === null) {
            return;
        }

        if (control.type === "node") {
            setupMoveNodesPointerEventHandlers(
                app,
                ev,
                this.getPathEntity(app),
                [control.node.id],
            );
        }

        if (control.type === "edge") {
            setupMoveNodesPointerEventHandlers(
                app,
                ev,
                this.getPathEntity(app),
                [control.edge.p0.id, control.edge.p1.id],
            );
        }

        if (control.type === "center-of-edge") {
            const entity = this.getPathEntity(app);

            const newNode = new GraphNode(
                randomId(),
                control.point.x,
                control.point.y,
            );

            const graph = entity.graph.clone();
            graph.addEdge(control.edge.p0, newNode);
            graph.addEdge(control.edge.p1, newNode);
            graph.deleteEdge(control.edge.p0.id, control.edge.p1.id);

            const newPath = new PathEntity(entity.props, graph);

            app.canvasStateStore.edit((draft) => {
                draft.setEntities([newPath]);
            });

            setupMoveNodesPointerEventHandlers(app, ev, newPath, [newNode.id]);
        }
    }

    onCanvasDoubleClick(app: App, ev: CanvasPointerEvent) {
        const entity = this.getPathEntity(app);

        app.setMode(createSelectEntityMode(new Set(entity.props.id)));
        app.unselectAll();
        app.select(entity.props.id);
        return;
    }

    onMouseMove(app: App, point: Point) {
        const control = this.getControlByPoint(app, point);
        if (control === null) {
            this.store.clearHighlight();
            app.appStateStore.setCursor("default");
            return;
        }

        switch (control.type) {
            case "node": {
                this.store.setHighlight({
                    highlightedItemIds: new Set([control.node.id]),
                    highlightCenterOfEdgeHandle: false,
                });
                app.appStateStore.setCursor("grab");
                break;
            }
            case "edge": {
                this.store.setHighlight({
                    highlightedItemIds: new Set([control.edge.id]),
                    highlightCenterOfEdgeHandle: false,
                });
                app.appStateStore.setCursor("grab");
                break;
            }
            case "center-of-edge": {
                this.store.setHighlight({
                    highlightedItemIds: new Set([control.edge.id]),
                    highlightCenterOfEdgeHandle: true,
                });
                app.appStateStore.setCursor("crosshair");
                break;
            }
        }
    }

    private getControlByPoint(app: App, point: Point): Control | null {
        const entity = this.getPathEntity(app);

        for (const node of entity.graph.nodes.values()) {
            const distance = Math.hypot(node.x - point.x, node.y - point.y);
            if (distance < NODE_CONTROL_HIT_AREA_RADIUS) {
                return { type: "node", node };
            }
        }

        for (const edge of entity.graph.getEdges()) {
            const { p0, p1 } = edge;
            const center = new Point((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
            const distance = Math.hypot(center.x - point.x, center.y - point.y);
            if (distance < NODE_CONTROL_HIT_AREA_RADIUS) {
                return { type: "center-of-edge", edge, point: center };
            }

            const entry = Line.of(p0.x, p0.y, p1.x, p1.y).getDistance(point);

            if (entry.distance < EDGE_CONTROL_HIT_AREA_WIDTH) {
                return { type: "edge", edge, point: entry.point };
            }
        }

        return null;
    }

    private getPathEntity(app: App): PathEntity {
        const mode = app.appStateStore.getState().mode;
        assert(isSelectPathMode(mode), `Invalid mode: ${mode.type}`);

        const entity = app.canvasStateStore
            .getState()
            .page.entities.get(mode.entityId);
        assert(entity instanceof PathEntity, `Invalid entity: ${entity}`);

        return entity;
    }
}

interface SelectPathMode extends Mode {
    type: "select-path";
    entityId: string;
}

export function isSelectPathMode(mode: Mode): mode is SelectPathMode {
    return mode.type === "select-path";
}

export function createSelectPathMode(entityId: string): SelectPathMode {
    return { type: "select-path", entityId };
}

export type Control =
    | { type: "edge"; edge: GraphEdge; point: Point }
    | { type: "center-of-edge"; edge: GraphEdge; point: Point }
    | { type: "node"; node: GraphNode };
