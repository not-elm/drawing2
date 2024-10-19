import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import { Graph, GraphNode } from "../../core/Graph";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import { ScaleSelectionTransformController } from "../../core/SelectionTransformController";
import { setupSelectionTransformPointerEventHandlers } from "../../core/setupSelectionTransformPointerEventHandlers";
import { Rect } from "../../lib/geo/Rect";
import { translate } from "../../lib/geo/TransformMatrix";
import { randomId } from "../../lib/randomId";
import { PathEntity } from "../entity/PathEntity/PathEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import { PROPERTY_KEY_STROKE_WIDTH } from "../property/StrokeWidth";

export class NewShapeModeController extends ModeController {
    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const p0 = ev.point;
        const p1 = translate(1, 1).apply(ev.point);

        app.historyManager.pause();
        const shape = this.insertNewShape(app, new Rect({ p0, p1 }));

        app.setMode({ type: "select-entity" });
        app.canvasStateStore.unselectAll();
        app.canvasStateStore.select(shape.props.id);

        setupSelectionTransformPointerEventHandlers(
            app,
            ev,
            new ScaleSelectionTransformController(
                app,
                p1,
                p0,
                "right",
                "bottom",
            ),
        );
    }

    private insertNewShape(app: App, rect: Rect): Entity {
        const topLeftNode = new GraphNode(
            randomId(),
            rect.topLeft.x,
            rect.topLeft.y,
        );
        const topRightNode = new GraphNode(
            randomId(),
            rect.topRight.x,
            rect.topRight.y,
        );
        const bottomRightNode = new GraphNode(
            randomId(),
            rect.bottomRight.x,
            rect.bottomRight.y,
        );
        const bottomLeftNode = new GraphNode(
            randomId(),
            rect.bottomLeft.x,
            rect.bottomLeft.y,
        );
        const graph = Graph.create();
        graph.addEdge(topLeftNode, topRightNode);
        graph.addEdge(topRightNode, bottomRightNode);
        graph.addEdge(bottomRightNode, bottomLeftNode);
        graph.addEdge(bottomLeftNode, topLeftNode);

        const shape = new PathEntity(
            {
                id: randomId(),
                [PROPERTY_KEY_COLOR_ID]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
                [PROPERTY_KEY_STROKE_STYLE]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_STROKE_STYLE, "solid"),
                [PROPERTY_KEY_STROKE_WIDTH]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_STROKE_WIDTH, 2),
                [PROPERTY_KEY_FILL_STYLE]: app.defaultPropertyStore
                    .getState()
                    .getOrDefault(PROPERTY_KEY_FILL_STYLE, "none"),
            },
            graph,
        );

        app.canvasStateStore.edit((draft) => {
            draft.setEntity(shape);
        });
        return shape;
    }
}
