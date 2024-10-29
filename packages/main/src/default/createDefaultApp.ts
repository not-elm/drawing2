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
        NewShapeModeController.MODE_NAME,
        new NewShapeModeController(),
    )
        .addModeController(
            NewPathModeController.MODE_NAME,
            new NewPathModeController(),
        )
        .addModeController(
            NewTextModeController.MODE_NAME,
            new NewTextModeController(),
        )
        .addModeController(
            EditTextModeController.MODE_NAME,
            new EditTextModeController(),
        )
        .registerEntityHandle(new PathEntityHandle())
        .registerEntityHandle(new TextEntityHandle());

    syncWithLocalStorage(app);

    return app;
}
