import { Rect } from "../../geo/Rect";
import { randomId } from "../../lib/randomId";
import type { Entity } from "../../model/Entity";
import type { TextEntity } from "../../model/TextEntity";
import { Transaction } from "../../model/Transaction";
import type { AppStateStore } from "../../store/AppStateStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type {
    AppController,
    PointerDownEventHandlerData,
} from "../AppController";
import { ModeController } from "./ModeController";

export class NewTextModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
        private readonly controller: AppController,
    ) {
        super();
    }

    getType() {
        return "new-text";
    }

    onEntityPointerDown(data: PointerDownEventHandlerData, entity: Entity) {
        this.onCanvasPointerDown(data);
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const text = this.insertNewText(Rect.fromSize(data.point, 1, 1));

        this.controller.setMode({
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

        this.canvasStateStore.setPage(
            new Transaction(this.canvasStateStore.getState().page)
                .insertEntities([text])
                .commit(),
        );

        return text;
    }
}
