import type { App } from "../../core/App";
import type { CanvasStateStore } from "../../core/CanvasStateStore";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController";
import type { Entity } from "../../core/model/Entity";
import { PropertyKey } from "../../core/model/PropertyKey";
import { Rect } from "../../lib/geo/Rect";
import { randomId } from "../../lib/randomId";
import type { TextEntity } from "../entity/TextEntity/TextEntity";

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
            [PropertyKey.TEXT_ALIGNMENT_X]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.TEXT_ALIGNMENT_X, "start"),
            [PropertyKey.COLOR_ID]: this.app.defaultPropertyStore
                .getState()
                .getOrDefault(PropertyKey.COLOR_ID, 0),
            sizingMode: "content",
        };

        this.app.edit((tx) => {
            tx.insertEntities([text]);
        });
        return text;
    }
}
