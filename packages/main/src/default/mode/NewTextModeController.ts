import type { App } from "../../core/App";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import { SelectEntityModeController } from "../../core/SelectEntityModeController";
import { Rect } from "../../core/shape/Shape";
import { randomId } from "../../lib/randomId";
import type { TextEntity } from "../entity/TextEntity/TextEntity";
import { PROPERTY_KEY_COLOR_ID } from "../property/Colors";
import { PROPERTY_KEY_TEXT_ALIGNMENT_X } from "../property/TextAlignment";
import { EditTextModeController } from "./EditTextModeController";

export class NewTextModeController extends ModeController {
    static readonly MODE_NAME = "new-text";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "t",
            action: (app, ev) => {
                app.setMode(NewTextModeController.MODE_NAME);
            },
        });
        app.keyboard.addBinding({
            key: "Escape",
            mode: [NewTextModeController.MODE_NAME],
            action: (app, ev) => {
                app.canvasStateStore.unselectAll();
                app.setMode(SelectEntityModeController.MODE_NAME);
            },
        });
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.historyManager.pause();
        const text = this.insertNewText(app, Rect.fromSize(ev.point, 1, 1));
        app.canvasStateStore.unselectAll();
        app.canvasStateStore.select(text.id);
        app.setMode(EditTextModeController.MODE_NAME);

        // To leave focus at the new text entity
        ev.preventDefault();
    }

    private insertNewText(app: App, rect: Rect): TextEntity {
        const text: TextEntity = {
            type: "text",
            id: randomId(),
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            content: "",
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]: app.defaultPropertyStore.state
                .get()
                .getOrDefault(PROPERTY_KEY_TEXT_ALIGNMENT_X, "start"),
            [PROPERTY_KEY_COLOR_ID]: app.defaultPropertyStore.state
                .get()
                .getOrDefault(PROPERTY_KEY_COLOR_ID, 0),
            sizingMode: "content",
        };

        app.canvasStateStore.edit((draft) => {
            draft.setEntity(text);
        });
        return text;
    }
}
