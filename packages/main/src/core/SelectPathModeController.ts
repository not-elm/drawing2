import type { Property } from "csstype";
import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { App } from "./App";
import { type CanvasPointerEvent, ModeController } from "./ModeController";
import { SelectEntityModeController } from "./SelectEntityModeController";
import { setupMoveNodesPointerEventHandlers } from "./setupMoveNodesPointerEventHandlers";
import { type GraphEdge, GraphNode } from "./shape/Graph";
import { Line } from "./shape/Line";
import { Point } from "./shape/Point";

const NODE_CONTROL_HIT_AREA_RADIUS = 16;
const EDGE_CONTROL_HIT_AREA_WIDTH = 16;

export class SelectPathModeController extends ModeController {
    static readonly MODE_NAME = "select-path";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "Escape",
            mode: [SelectPathModeController.MODE_NAME],
            action: (app, ev) => {
                app.setMode(SelectEntityModeController.MODE_NAME);
            },
        });
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const control = this.getControlByPoint(app, ev.point);
        if (control === null) {
            app.setMode(SelectEntityModeController.MODE_NAME);
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
                [control.edge.p1.id, control.edge.p2.id],
            );
        }

        if (control.type === "center-of-edge") {
            const entity = this.getPathEntity(app);

            const newNode = new GraphNode(randomId(), control.point);

            const graph = entity.graph.clone();
            graph.addEdge(control.edge.p1, newNode);
            graph.addEdge(control.edge.p2, newNode);
            graph.deleteEdge(control.edge.p1.id, control.edge.p2.id);

            const newPath = new PathEntity(entity.props, graph);

            app.canvasStateStore.edit((draft) => {
                draft.setEntities([newPath]);
            });

            setupMoveNodesPointerEventHandlers(app, ev, newPath, [newNode.id]);
        }
    }

    computeControlLayerData(
        app: App,
        pointerPoint: Point,
    ): {
        highlightedItemIds: Set<string>;
        highlightCenterOfEdgeHandle: boolean;
    } {
        const control = this.getControlByPoint(app, pointerPoint);
        if (control === null) {
            return {
                highlightedItemIds: new Set(),
                highlightCenterOfEdgeHandle: false,
            };
        }

        switch (control.type) {
            case "node": {
                return {
                    highlightedItemIds: new Set([control.node.id]),
                    highlightCenterOfEdgeHandle: false,
                };
            }
            case "edge": {
                return {
                    highlightedItemIds: new Set([control.edge.id]),
                    highlightCenterOfEdgeHandle: false,
                };
            }
            case "center-of-edge": {
                return {
                    highlightedItemIds: new Set([control.edge.id]),
                    highlightCenterOfEdgeHandle: true,
                };
            }
        }
    }

    getCursor(app: App): Property.Cursor {
        const control = this.getControlByPoint(
            app,
            app.appStateStore.getState().pointerPosition,
        );
        if (control === null) return "default";

        switch (control.type) {
            case "node":
            case "edge":
                return "grab";
            case "center-of-edge":
                return "crosshair";
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
            const { p1, p2 } = edge;
            const center = new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
            const distance = Math.hypot(center.x - point.x, center.y - point.y);
            if (distance < NODE_CONTROL_HIT_AREA_RADIUS) {
                return { type: "center-of-edge", edge, point: center };
            }

            const entry = Line.of(p1.x, p1.y, p2.x, p2.y).getDistance(point);

            if (entry.distance < EDGE_CONTROL_HIT_AREA_WIDTH) {
                return { type: "edge", edge, point: entry.point };
            }
        }

        return null;
    }

    private getPathEntity(app: App): PathEntity {
        const entity = app.canvasStateStore.getState().getSelectedEntities()[0];
        assert(entity instanceof PathEntity, `Invalid entity: ${entity}`);

        return entity;
    }
}

export type Control =
    | { type: "edge"; edge: GraphEdge; point: Point }
    | { type: "center-of-edge"; edge: GraphEdge; point: Point }
    | { type: "node"; node: GraphNode };
