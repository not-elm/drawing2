import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import { ResizeEntityModeController } from "../../core/mode/ResizeEntityModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Graph, GraphNode } from "../../core/shape/Graph";
import { Rect } from "../../core/shape/Shape";
import { translate } from "../../core/shape/TransformMatrix";
import { randomId } from "../../lib/randomId";
import {
    PROPERTY_KEY_ARROW_HEAD_NODE_IDS,
    PROPERTY_KEY_CORNER_RADIUS,
    type PathEntity,
} from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

export class NewShapeModeController extends ModeController {
    static readonly type = "new-shape";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "r",
            action: (app, ev) => {
                app.setMode(NewShapeModeController.type);
            },
        });
        app.keyboard.addBinding({
            key: "Escape",
            mode: [NewShapeModeController.type],
            action: (app, ev) => {
                app.canvas.unselectAll();
                app.setMode(SelectEntityModeController.type);
            },
        });
    }

    onPointerDown(app: App, ev: CanvasPointerEvent): void {
        const p0 = ev.point;
        const p1 = translate(1, 1).apply(ev.point);

        app.history.pause();
        const shape = this.insertNewShape(app, new Rect(p0, p1));

        app.setMode(SelectEntityModeController.type);
        app.canvas.unselectAll();
        app.canvas.select(shape.id);

        app.setMode(ResizeEntityModeController.type);
        app.gesture.addPointerUpHandler(ev.pointerId, (app, ev) => {
            if (ev.isTap) {
                app.canvas.edit((builder) => builder.deleteEntity(shape.id));
            }
        });
    }

    private insertNewShape(app: App, rect: Rect): Entity {
        const topLeftNode = new GraphNode(randomId(), rect.topLeft);
        const topRightNode = new GraphNode(randomId(), rect.topRight);
        const bottomRightNode = new GraphNode(randomId(), rect.bottomRight);
        const bottomLeftNode = new GraphNode(randomId(), rect.bottomLeft);
        const graph = Graph.create();
        graph.addEdge(topLeftNode, topRightNode);
        graph.addEdge(topRightNode, bottomRightNode);
        graph.addEdge(bottomRightNode, bottomLeftNode);
        graph.addEdge(bottomLeftNode, topLeftNode);

        const shape: PathEntity = {
            id: randomId(),
            type: "path",
            nodes: [
                { id: topLeftNode.id, x: topLeftNode.x, y: topLeftNode.y },
                { id: topRightNode.id, x: topRightNode.x, y: topRightNode.y },
                {
                    id: bottomRightNode.id,
                    x: bottomRightNode.x,
                    y: bottomRightNode.y,
                },
                {
                    id: bottomLeftNode.id,
                    x: bottomLeftNode.x,
                    y: bottomLeftNode.y,
                },
            ],
            edges: [
                [topLeftNode.id, topRightNode.id],
                [topRightNode.id, bottomRightNode.id],
                [bottomRightNode.id, bottomLeftNode.id],
                [bottomLeftNode.id, topLeftNode.id],
            ],
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

        app.canvas.edit((builder) => builder.setEntity(shape));
        return shape;
    }
}
