import { type ReactNode, createContext, useContext, useMemo } from "react";
import { Controller } from "../service/Controller";
import { EditTextModeController } from "../service/ModeController/EditTextModeController";
import { NewLineModeController } from "../service/ModeController/NewLineModeController";
import { NewShapeModeController } from "../service/ModeController/NewShapeModeController";
import { NewTextModeController } from "../service/ModeController/NewTextModeController";
import { SelectModeController } from "../service/ModeController/SelectModeController";

const context = createContext<Controller>(null as never);

export function ControllerProvider({ children }: { children?: ReactNode }) {
    const controller = useMemo(() => createController(), []);

    return <context.Provider value={controller}>{children}</context.Provider>;
}

export function useController(): Controller {
    return useContext(context);
}

export function createController() {
    const controller = new Controller();

    const selectModeController = new SelectModeController(
        controller.canvasStateStore,
        controller.brushStore,
        controller.gestureRecognizer,
        controller.historyManager,
        controller.viewportStore,
        controller.snapGuideStore,
        controller.appStateStore,
        controller,
    );

    controller
        .addModeController("select", selectModeController)
        .addModeController(
            "new-shape",
            new NewShapeModeController(
                controller.canvasStateStore,
                controller.appStateStore,
                controller,
                controller.historyManager,
                controller.viewportStore,
                controller.snapGuideStore,
                controller.gestureRecognizer,
            ),
        )
        .addModeController(
            "new-line",
            new NewLineModeController(
                controller.canvasStateStore,
                controller.appStateStore,
                controller,
                controller.historyManager,
                controller.viewportStore,
                controller.gestureRecognizer,
            ),
        )
        .addModeController(
            "new-text",
            new NewTextModeController(
                controller.canvasStateStore,
                controller.appStateStore,
                controller,
            ),
        )
        .addModeController(
            "edit-text",
            new EditTextModeController(
                controller,
                selectModeController,
                controller.canvasStateStore,
            ),
        );

    return controller;
}
