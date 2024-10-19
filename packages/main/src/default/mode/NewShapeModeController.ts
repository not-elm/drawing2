import type { App } from "../../core/App";
import type { Entity } from "../../core/Entity";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import type { PathNode } from "../../core/Path";
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

        app.setMode({ type: "select" });
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
        const topLeftNode = { id: randomId(), point: rect.topLeft };
        const topRightNode = { id: randomId(), point: rect.topRight };
        const bottomRightNode = { id: randomId(), point: rect.bottomRight };
        const bottomLeftNode = { id: randomId(), point: rect.bottomLeft };
        const nodes = new Map<string, PathNode>();
        nodes.set(topLeftNode.id, topLeftNode);
        nodes.set(topRightNode.id, topRightNode);
        nodes.set(bottomRightNode.id, bottomRightNode);
        nodes.set(bottomLeftNode.id, bottomLeftNode);

        const shape = new PathEntity({
            id: randomId(),
            nodes,
            edges: [
                [topLeftNode.id, topRightNode.id],
                [topRightNode.id, bottomRightNode.id],
                [bottomRightNode.id, bottomLeftNode.id],
                [bottomLeftNode.id, topLeftNode.id],
            ],
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
        });

        app.canvasStateStore.edit((draft) => {
            draft.setEntity(shape);
        });
        return shape;
    }
}
