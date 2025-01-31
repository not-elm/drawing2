import type { App } from "../../core/App";
import { Color } from "../../core/Color";
import {
    type CanvasPointerEvent,
    ModeController,
} from "../../core/ModeController";
import { SelectEntityModeController } from "../../core/mode/SelectEntityModeController";
import { Rect } from "../../core/shape/Shape";
import { randomId } from "../../lib/randomId";
import {
    type TextEntity,
    TextEntityHandle,
} from "../entity/TextEntity/TextEntity";
import { PROPERTY_KEY_TEXT_COLOR } from "../property/Colors";
import { PROPERTY_KEY_TEXT_ALIGNMENT_X } from "../property/TextAlignment";
import { EditTextModeController } from "./EditTextModeController";

export class NewTextModeController extends ModeController {
    static readonly type = "new-text";

    onRegistered(app: App) {
        app.keyboard.addBinding({
            key: "t",
            action: (app, ev) => {
                app.setMode(NewTextModeController.type);
            },
        });
        app.keyboard.addBinding({
            key: "Escape",
            mode: [NewTextModeController.type],
            action: (app, ev) => {
                app.canvas.unselectAll();
                app.setMode(SelectEntityModeController.type);
            },
        });
    }

    onPointerDown(app: App, ev: CanvasPointerEvent): void {
        app.history.addCheckpoint();

        const text = this.insertNewText(app, Rect.fromSize(ev.point, 1, 1));
        app.canvas.unselectAll();
        app.canvas.select(text.id);
        app.setMode(EditTextModeController.type);

        // To leave focus at the new text entity
        ev.preventDefault();
    }

    private insertNewText(app: App, rect: Rect): TextEntity {
        const text: TextEntity = {
            type: "text",
            id: randomId(),
            schemaVersion: TextEntityHandle.SCHEMA_VERSION,
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            content: "",
            [PROPERTY_KEY_TEXT_ALIGNMENT_X]: app.getSelectedPropertyValue(
                PROPERTY_KEY_TEXT_ALIGNMENT_X,
                "start",
            ),
            [PROPERTY_KEY_TEXT_COLOR]: app.getSelectedPropertyValue(
                PROPERTY_KEY_TEXT_COLOR,
                Color.Black,
            ),
            sizingMode: "content",
        };

        app.canvas.edit((builder) => builder.setEntity(text));
        return text;
    }
}
