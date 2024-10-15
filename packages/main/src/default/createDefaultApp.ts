import { App } from "../core/App";
import { PathEntity } from "./entity/PathEntity/PathEntity";
import { PathView } from "./entity/PathEntity/PathView";
import { ShapeEntity } from "./entity/ShapeEntity/ShapeEntity";
import { ShapeView } from "./entity/ShapeEntity/ShapeView";
import { TextEntity } from "./entity/TextEntity/TextEntity";
import { TextView } from "./entity/TextEntity/TextView";
import { EditTextModeController } from "./mode/EditTextModeController";
import { NewPathModeController } from "./mode/NewPathModeController";
import { NewShapeModeController } from "./mode/NewShapeModeController";
import { NewTextModeController } from "./mode/NewTextModeController";
import { SelectModeController } from "./mode/SelectModeController";

export function createDefaultApp(): App {
    const app = new App();

    app.registerEntityView(PathEntity, PathView)
        .registerEntityView(ShapeEntity, ShapeView)
        .registerEntityView(TextEntity, TextView);

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
        .registerEntityConverter("path", {
            deserialize(data) {
                return PathEntity.deserialize(data);
            },
            serialize(entity) {
                return entity.serialize();
            },
        })
        .registerEntityConverter("shape", {
            deserialize(data) {
                return ShapeEntity.deserialize(data);
            },
            serialize(entity) {
                return entity.serialize();
            },
        })
        .registerEntityConverter("text", {
            deserialize(data) {
                return TextEntity.deserialize(data);
            },
            serialize(entity) {
                return entity.serialize();
            },
        });

    return app;
}
