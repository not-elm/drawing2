import { App } from "../core/App";
import { PathEntity } from "./entity/PathEntity/PathEntity";
import { PathView } from "./entity/PathEntity/PathView";
import { TextEntity } from "./entity/TextEntity/TextEntity";
import { TextView } from "./entity/TextEntity/TextView";
import { EditTextModeController } from "./mode/EditTextModeController";
import { NewPathModeController } from "./mode/NewPathModeController";
import { NewShapeModeController } from "./mode/NewShapeModeController";
import { NewTextModeController } from "./mode/NewTextModeController";
import { syncWithLocalStorage } from "./syncWithLocalStorage";

export function createDefaultApp(): App {
    const app = new App();

    app.addModeController("new-shape", new NewShapeModeController())
        .addModeController("new-path", new NewPathModeController())
        .addModeController("new-text", new NewTextModeController())
        .addModeController("edit-text", new EditTextModeController())
        .registerEntityView("path", PathView)
        .registerEntityConverter("path", {
            deserialize(data) {
                return PathEntity.deserialize(data);
            },
            serialize(entity) {
                return entity.serialize();
            },
        })
        .registerEntityView("text", TextView)
        .registerEntityConverter("text", {
            deserialize(data) {
                return TextEntity.deserialize(data);
            },
            serialize(entity) {
                return entity.serialize();
            },
        });

    syncWithLocalStorage(app);

    return app;
}
