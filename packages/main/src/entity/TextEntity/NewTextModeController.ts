import type { AppController } from "../../core/AppController";
import {
    ModeController,
    type PointerDownEvent,
} from "../../core/ModeController/ModeController";
import type { Entity } from "../../core/model/Entity";
import type { AppStateStore } from "../../core/store/AppStateStore";
import type { CanvasStateStore } from "../../core/store/CanvasStateStore";
import { Rect } from "../../lib/geo/Rect";
import { randomId } from "../../lib/randomId";
import type { TextEntity } from "./TextEntity";

export class NewTextModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly appController: AppController,
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

        // To leave focus at the new text entity
        data.preventDefault();
    }

    private insertNewText(rect: Rect): TextEntity {
        const text: TextEntity = {
            id: randomId(),
            type: "text",
            rect,
            content: "",
            textAlignment:
                this.appStateStore.getState().defaultTextEntityTextAlignment,
            sizingMode: "content",
        };

        this.appController.edit((tx) => {
            tx.insertEntities([text]);
        });
        return text;
    }
}
