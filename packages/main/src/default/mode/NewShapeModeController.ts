import type { App } from "../../core/App";
import type { CanvasStateStore } from "../../core/CanvasStateStore";
import type { GestureRecognizer } from "../../core/GestureRecognizer";
import type { HistoryManager } from "../../core/HistoryManager";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController";
import type { SnapGuideStore } from "../../core/SnapGuideStore";
import type { ViewportStore } from "../../core/ViewportStore";
import { createTransformSession } from "../../core/createTransformSession";
import { Direction } from "../../core/model/Direction";
import type { Entity } from "../../core/model/Entity";
import { PropertyKey } from "../../core/model/PropertyKey";
import { createScaleTransformHandle } from "../../core/model/TransformHandle";
import { Rect } from "../../lib/geo/Rect";
import { getRectanglePath } from "../../lib/geo/path";
import { randomId } from "../../lib/randomId";
import type { ShapeEntity } from "../entity/ShapeEntity/ShapeEntity";

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
        this.canvasStateStore.select(shape.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createTransformSession(
                this.historyManager,
                createScaleTransformHandle(
                    this.canvasStateStore,
                    this.viewportStore,
                    this.snapGuideStore,
                    Direction.bottomRight,
                    this.app.handle,
                ),
            ),
        );
    }

    private insertNewShape(rect: Rect): ShapeEntity {
        const shape: ShapeEntity = {
            type: "shape",
            id: randomId(),
            rect,
            content: "",
            [PropertyKey.TEXT_ALIGNMENT_X]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.TEXT_ALIGNMENT_X, "start"),
            [PropertyKey.TEXT_ALIGNMENT_Y]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.TEXT_ALIGNMENT_Y, "start"),
            [PropertyKey.COLOR_ID]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.COLOR_ID, 0),
            [PropertyKey.FILL_STYLE]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.FILL_STYLE, "none"),
            [PropertyKey.STROKE_STYLE]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.STROKE_STYLE, "solid"),
            path: getRectanglePath(),
        };

        this.app.edit((tx) => {
            tx.insertEntities([shape]);
        });
        return shape;
    }
}
