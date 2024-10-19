import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { assert } from "../lib/assert";
import { Line } from "../lib/geo/Line";
import type { Point } from "../lib/geo/Point";
import { randomId } from "../lib/randomId";
import type { App } from "./App";
import { GraphNode } from "./Graph";
import {
    type CanvasPointerEvent,
    type Mode,
    ModeController,
} from "./ModeController";
import { setupMovePointPointerEventHandlers } from "./setupMovePointPointerEventHandlers";

const NODE_CONTROL_HIT_AREA_RADIUS = 16;
const EDGE_CONTROL_HIT_AREA_WIDTH = 16;

export class EditPathModeController extends ModeController {
    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const control = this.getControlByPoint(app, ev.point);
        if (control === null) {
            const entity = this.getPathEntity(app);

            app.setMode({ type: "select" });
            app.canvasStateStore.unselectAll();
            app.canvasStateStore.select(entity.props.id);
            return;
        }

        if (control.type === "node") {
            setupMovePointPointerEventHandlers(
                app,
                ev,
                this.getPathEntity(app),
                control.node.id,
            );
        }

        if (control.type === "edge") {
            const entity = this.getPathEntity(app);

            const newNode = new GraphNode(
                randomId(),
                control.point.x,
                control.point.y,
            );

            const graph = entity.graph.clone();
            graph.addEdge(control.edge[0], newNode);
            graph.addEdge(control.edge[1], newNode);
            graph.deleteEdge(control.edge[0].id, control.edge[1].id);

            const newPath = new PathEntity(entity.props, graph);

            app.canvasStateStore.edit((draft) => {
                draft.setEntities([newPath]);
            });

            setupMovePointPointerEventHandlers(app, ev, newPath, newNode.id);
        }
    }

    onMouseMove(app: App, point: Point) {
        const control = this.getControlByPoint(app, point);
        if (control === null) {
            app.appStateStore.setCursor("default");
        } else if (control.type === "node") {
            app.appStateStore.setCursor("grab");
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
            const [node1, node2] = edge;
            const entry = Line.of(
                node1.x,
                node1.y,
                node2.x,
                node2.y,
            ).getDistance(point);

            if (entry.distance < EDGE_CONTROL_HIT_AREA_WIDTH) {
                return { type: "edge", edge, point: entry.point };
            }
        }

        return null;
    }

    private getPathEntity(app: App): PathEntity {
        const mode = app.appStateStore.getState().mode;
        assert(isEditPathMode(mode), `Invalid mode: ${mode.type}`);

        const entity = app.canvasStateStore
            .getState()
            .page.entities.get(mode.entityId);
        assert(entity instanceof PathEntity, `Invalid entity: ${entity}`);

        return entity;
    }
}

interface EditPathMode extends Mode {
    type: "edit-path";
    entityId: string;
}

export function isEditPathMode(mode: Mode): mode is EditPathMode {
    return mode.type === "edit-path";
}

export function createEditPathMode(entityId: string): EditPathMode {
    return { type: "edit-path", entityId };
}

export type Control =
    | { type: "edge"; edge: [GraphNode, GraphNode]; point: Point }
    | { type: "node"; node: GraphNode };
