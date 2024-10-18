import type { App } from "../../core/App";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import { ScaleSelectionTransformController } from "../../core/SelectionTransformController";
import { setupSelectionTransformPointerEventHandlers } from "../../core/setupSelectionTransformPointerEventHandlers";
import { Rect } from "../../lib/geo/Rect";
import { translate } from "../../lib/geo/TransformMatrix";
import { getRectanglePath } from "../../lib/geo/path";
import { randomId } from "../../lib/randomId";
import { ShapeEntity } from "../entity/PathEntity/ShapeEntity";
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

    private insertNewShape(app: App, rect: Rect): ShapeEntity {
        const shape = new ShapeEntity({
            id: randomId(),
            rect,
            [PROPERTY_KEY_COLOR_ID]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
            [PROPERTY_KEY_FILL_STYLE]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_FILL_STYLE, "none"),
            [PROPERTY_KEY_STROKE_STYLE]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_STROKE_STYLE, "solid"),
            [PROPERTY_KEY_STROKE_WIDTH]: app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_STROKE_WIDTH, 2),
            path: getRectanglePath(),
        });

        app.canvasStateStore.edit((draft) => {
            draft.setEntity(shape);
        });
        return shape;
    }
}
