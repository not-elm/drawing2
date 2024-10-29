import { App } from "../core/App";
import { PathEntityHandle } from "./entity/PathEntity/PathEntity";
import { TextEntityHandle } from "./entity/TextEntity/TextEntity";
import { EditTextModeController } from "./mode/EditTextModeController";
import { NewPathModeController } from "./mode/NewPathModeController";
import { NewShapeModeController } from "./mode/NewShapeModeController";
import { NewTextModeController } from "./mode/NewTextModeController";
import { syncWithLocalStorage } from "./syncWithLocalStorage";

export function createDefaultApp(): App {
    const app = new App();

    app.addModeController(
        NewShapeModeController.type,
        new NewShapeModeController(),
    )
        .addModeController(
            NewPathModeController.type,
            new NewPathModeController(),
        )
        .addModeController(
            NewTextModeController.type,
            new NewTextModeController(),
        )
        .addModeController(
            EditTextModeController.type,
            new EditTextModeController(),
        )
        .registerEntityHandle(new PathEntityHandle())
        .registerEntityHandle(new TextEntityHandle());

    syncWithLocalStorage(app);

    return app;
}
