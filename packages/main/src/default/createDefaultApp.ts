import { App } from "../core/App";
import { PathEntityHandle } from "./entity/PathEntity/PathEntityHandle";
import { PathEntityViewHandle } from "./entity/PathEntity/PathEntityViewHandle";
import { ShapeEntityHandle } from "./entity/ShapeEntity/ShapeEntityHandle";
import { ShapeEntityViewHandle } from "./entity/ShapeEntity/ShapeEntityViewHandle";
import { TextEntityHandle } from "./entity/TextEntity/TextEntityHandle";
import { TextEntityViewHandle } from "./entity/TextEntity/TextEntityViewHandle";
import { EditTextModeController } from "./mode/EditTextModeController";
import { NewPathModeController } from "./mode/NewPathModeController";
import { NewShapeModeController } from "./mode/NewShapeModeController";
import { NewTextModeController } from "./mode/NewTextModeController";
import { SelectModeController } from "./mode/SelectModeController";

export function createDefaultApp(): App {
    const app = new App();

    app.viewHandle
        .register(new PathEntityViewHandle())
        .register(new ShapeEntityViewHandle())
        .register(new TextEntityViewHandle());

    const newTextModeController = new NewTextModeController(
        app,
        app.canvasStateStore,
    );

    const selectModeController = new SelectModeController(
        app.canvasStateStore,
        app.brushStore,
        app.gestureRecognizer,
        app.historyManager,
        app.viewportStore,
        app.snapGuideStore,
        app.appStateStore,
        app,
        newTextModeController,
    );

    app.addModeController(selectModeController)
        .addModeController(
            new NewShapeModeController(
                app.canvasStateStore,
                app,
                app.historyManager,
                app.viewportStore,
                app.snapGuideStore,
                app.gestureRecognizer,
            ),
        )
        .addModeController(
            new NewPathModeController(
                app.canvasStateStore,
                app.appStateStore,
                app,
                app.historyManager,
                app.gestureRecognizer,
            ),
        )
        .addModeController(newTextModeController)
        .addModeController(
            new EditTextModeController(app, selectModeController),
        )
        .registerEntityHandle(new PathEntityHandle())
        .registerEntityHandle(new ShapeEntityHandle())
        .registerEntityHandle(new TextEntityHandle());

    return app;
}
