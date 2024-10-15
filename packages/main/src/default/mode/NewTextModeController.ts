import type { App } from "../../core/App";
import type { CanvasStateStore } from "../../core/CanvasStateStore";
import type { Entity } from "../../core/Entity";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController";
import { Rect } from "../../lib/geo/Rect";
import { randomId } from "../../lib/randomId";
import { TextEntity } from "../entity/TextEntity/TextEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_TEXT_ALIGNMENT_X } from "../property/TextAlignment";

export class NewTextModeController extends ModeController {
    constructor(
        private readonly app: App,
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

        this.app.setMode({
            type: "edit-text",
            entityId: text.props.id,
        });

        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(text.props.id);

        // To leave focus at the new text entity
        data.preventDefault();
    }

    private insertNewText(rect: Rect): TextEntity {
        const text = new TextEntity({
            id: randomId(),
            rect,
            content: "",
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_TEXT_ALIGNMENT_X, "start"),
            [PROPERTY_KEY_COLOR_ID]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
            sizingMode: "content",
        });

        this.app.edit((tx) => {
            tx.insertEntities([text]);
        });
        return text;
    }
}
