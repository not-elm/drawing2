import type { AppController } from "../../core/AppController";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController/ModeController";
import type { Entity } from "../../core/model/Entity";
import type { CanvasStateStore } from "../../core/store/CanvasStateStore";
import { PROPERTY_KEY_COLOR_ID } from "../../core/view/PropertySection/ColorPropertySection/ColorPropertySection";
import { PROPERTY_KEY_TEXT_ALIGNMENT_X } from "../../core/view/PropertySection/TextAlignmentPropertySection/TextAlignmentPropertySection";
import {
    colorPropertySection,
    textAlignmentPropertySection,
} from "../../instance";
import { Rect } from "../../lib/geo/Rect";
import { randomId } from "../../lib/randomId";
import type { TextEntity } from "./TextEntity";

export class NewTextModeController extends ModeController {
    constructor(
        private readonly appController: AppController,
        private readonly canvasStateStore: CanvasStateStore,
    ) {
        super();
    }

    getType() {
        return "new-text";
    }

    onEntityPointerDown(data: PointerDownEvent, entity: Entity) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEvent): void {
        const text = this.insertNewText(Rect.fromSize(data.point, 1, 1));

        this.appController.setMode({
            type: "edit-text",
            entityId: text.id,
        });

        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(text.id);

        // To leave focus at the new text entity
        data.preventDefault();
    }

    private insertNewText(rect: Rect): TextEntity {
        const text: TextEntity = {
            id: randomId(),
            type: "text",
            rect,
            content: "",
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]:
                textAlignmentPropertySection().getState().defaultAlignX,
            [PROPERTY_KEY_COLOR_ID]:
                colorPropertySection().getState().defaultColorId,
            sizingMode: "content",
        };

        this.appController.edit((tx) => {
            tx.insertEntities([text]);
        });
        return text;
    }
}
