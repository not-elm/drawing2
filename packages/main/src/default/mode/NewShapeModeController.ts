import type { App } from "../../core/App";
import type { CanvasStateStore } from "../../core/CanvasStateStore";
import { Direction } from "../../core/Direction";
import type { Entity } from "../../core/Entity";
import type { GestureRecognizer } from "../../core/GestureRecognizer";
import type { HistoryManager } from "../../core/HistoryManager";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController";
import { createScaleTransformHandle } from "../../core/TransformHandle";
import type { ViewportStore } from "../../core/ViewportStore";
import { createTransformSession } from "../../core/createTransformSession";
import { Rect } from "../../lib/geo/Rect";
import { getRectanglePath } from "../../lib/geo/path";
import { randomId } from "../../lib/randomId";
import { ShapeEntity } from "../entity/ShapeEntity/ShapeEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_FILL_STYLE } from "../property/FillStyle";
import { PROPERTY_KEY_STROKE_STYLE } from "../property/StrokeStyle";
import {
    PROPERTY_KEY_TEXT_ALIGNMENT_X,
    PROPERTY_KEY_TEXT_ALIGNMENT_Y,
} from "../property/TextAlignment";
import type { SnapGuideStore } from "./select/SnapGuideStore";

export class NewShapeModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly app: App,
        private readonly historyManager: HistoryManager,
        private readonly viewportStore: ViewportStore,
        private readonly snapGuideStore: SnapGuideStore,
        private readonly gestureRecognizer: GestureRecognizer,
    ) {
        super();
    }

    getType() {
        return "new-shape";
    }

    onEntityPointerDown(data: PointerDownEvent, entity: Entity) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEvent): void {
        const shape = this.insertNewShape(
            new Rect({
                p0: data.point,
                p1: data.point.translate(1, 1),
            }),
        );

        this.app.setMode({ type: "select" });
        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(shape.props.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createTransformSession(
                this.historyManager,
                createScaleTransformHandle(
                    this.canvasStateStore,
                    this.viewportStore,
                    this.snapGuideStore,
                    Direction.bottomRight,
                ),
            ),
        );
    }

    private insertNewShape(rect: Rect): ShapeEntity {
        const shape = new ShapeEntity({
            id: randomId(),
            rect,
            content: "",
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_TEXT_ALIGNMENT_X, "center"),
            [PROPERTY_KEY_TEXT_ALIGNMENT_Y]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_TEXT_ALIGNMENT_Y, "center"),
            [PROPERTY_KEY_COLOR_ID]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
            [PROPERTY_KEY_FILL_STYLE]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_FILL_STYLE, "none"),
            [PROPERTY_KEY_STROKE_STYLE]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_STROKE_STYLE, "solid"),
            path: getRectanglePath(),
        });

        this.app.edit((tx) => {
            tx.insertEntities([shape]);
        });
        return shape;
    }
}
