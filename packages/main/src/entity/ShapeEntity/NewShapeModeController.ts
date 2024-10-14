import type { AppController } from "../../core/AppController";
import type { GestureRecognizer } from "../../core/GestureRecognizer";
import type { HistoryManager } from "../../core/HistoryManager";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController/ModeController";
import { createTransformSession } from "../../core/PointerEventSession/createTransformSession";
import { Direction } from "../../core/model/Direction";
import type { Entity } from "../../core/model/Entity";
import { createScaleTransformHandle } from "../../core/model/TransformHandle";
import type { AppStateStore } from "../../core/store/AppStateStore";
import type { CanvasStateStore } from "../../core/store/CanvasStateStore";
import type { SnapGuideStore } from "../../core/store/SnapGuideStore";
import type { ViewportStore } from "../../core/store/ViewportStore";
import { PROPERTY_KEY_COLOR_ID } from "../../core/view/PropertySection/ColorPropertySection/ColorPropertySection";
import { PROPERTY_KEY_FILL_MODE } from "../../core/view/PropertySection/FillModePropertySection/FillModePropertySection";
import {
    PROPERTY_KEY_TEXT_ALIGNMENT_X,
    PROPERTY_KEY_TEXT_ALIGNMENT_Y,
} from "../../core/view/PropertySection/TextAlignmentPropertySection/TextAlignmentPropertySection";
import {
    colorPropertySection,
    fillModePropertySection,
    textAlignmentPropertySection,
} from "../../instance";
import { Rect } from "../../lib/geo/Rect";
import { getRectanglePath } from "../../lib/geo/path";
import { randomId } from "../../lib/randomId";
import type { ShapeEntity } from "./ShapeEntity";

export class NewShapeModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly appController: AppController,
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

        this.appController.setMode({ type: "select" });
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
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]:
                textAlignmentPropertySection().getState().defaultAlignX,
            [PROPERTY_KEY_TEXT_ALIGNMENT_Y]:
                textAlignmentPropertySection().getState().defaultAlignY,
            [PROPERTY_KEY_COLOR_ID]:
                colorPropertySection().getState().defaultColorId,
            [PROPERTY_KEY_FILL_MODE]:
                fillModePropertySection().getState().defaultFillMode,
            strokeStyle: this.appStateStore.getState().defaultStrokeStyle,
            path: getRectanglePath(),
        };

        this.appController.edit((tx) => {
            tx.insertEntities([shape]);
        });
        return shape;
    }
}
