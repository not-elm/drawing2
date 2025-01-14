import { App } from "../core/App";
import { PathEntityHandle } from "./entity/PathEntity/PathEntity";
import { TextEntityHandle } from "./entity/TextEntity/TextEntity";
import { setUpExportAsSVG } from "./exportAsSVG";
import { EditTextModeController } from "./mode/EditTextModeController";
import { NewPathModeController } from "./mode/NewPathModeController";
import { NewShapeModeController } from "./mode/NewShapeModeController";
import { NewTextModeController } from "./mode/NewTextModeController";
import { syncWithLocalStorage } from "./syncWithLocalStorage";

export function createDefaultApp(
    option: {
        enableSyncWithLocalStorage?: boolean;
        enableExportAsSVG?: boolean;
    } = {},
): App {
    const { enableSyncWithLocalStorage = true, enableExportAsSVG = true } =
        option;

    const app = new App();

    app.addModeController(
        NewShapeModeController.type,
        new NewShapeModeController(),
    )
        .addModeController(
            NewPathModeController.type,
            new NewPathModeController(app),
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

    if (enableSyncWithLocalStorage) {
        syncWithLocalStorage(app);
        app.history.clear();
    }
    if (enableExportAsSVG) {
        setUpExportAsSVG(app);
    }

    return app;
}
