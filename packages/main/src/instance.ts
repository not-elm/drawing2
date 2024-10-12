import { singleton } from "./lib/singleton";
import { AppController } from "./service/AppController";
import { GestureRecognizer } from "./service/GestureRecognizer";
import { HistoryManager } from "./service/HistoryManager";
import { EditTextModeController } from "./service/ModeController/EditTextModeController";
import { NewLineModeController } from "./service/ModeController/NewLineModeController";
import { NewShapeModeController } from "./service/ModeController/NewShapeModeController";
import { NewTextModeController } from "./service/ModeController/NewTextModeController";
import { SelectModeController } from "./service/ModeController/SelectModeController";
import { URLQueryRestoreViewportService } from "./service/URLQueryRestoreViewportService";
import { AppStateStore } from "./store/AppStateStore";
import { BrushStore } from "./store/BrushStore";
import { CanvasStateStore } from "./store/CanvasStateStore";
import { PropertyPanelStateStore } from "./store/PropertyPanelStateStore";
import { SnapGuideStore } from "./store/SnapGuideStore";
import { ViewportStore } from "./store/ViewportStore";

const appController = singleton(
    () =>
        new AppController(
            canvasStateStore(),
            viewportStore(),
            gestureRecognizer(),
            appStateStore(),
            propertyPanelStateStore(),
            historyManager(),
            snapGuideStore(),
            brushStore(),
        ),
);

const propertyPanelStateStore = singleton(() => {
    return new PropertyPanelStateStore(canvasStateStore(), appStateStore());
});

const brushStore = singleton(() => {
    return new BrushStore();
});

const canvasStateStore = singleton(() => {
    return new CanvasStateStore();
});

const appStateStore = singleton(() => {
    return new AppStateStore();
});

const historyManager = singleton(() => {
    return new HistoryManager(canvasStateStore());
});

const restoreViewportService = singleton(() => {
    return new URLQueryRestoreViewportService();
});

const viewportStore = singleton(() => {
    return new ViewportStore(restoreViewportService());
});

const snapGuideStore = singleton(() => {
    return new SnapGuideStore();
});

const gestureRecognizer = singleton(() => {
    return new GestureRecognizer(viewportStore());
});

const selectModeController = singleton(() => {
    return new SelectModeController(
        canvasStateStore(),
        brushStore(),
        gestureRecognizer(),
        historyManager(),
        viewportStore(),
        snapGuideStore(),
        appStateStore(),
        appController(),
        newTextModeController(),
    );
});

const newShapeModeController = singleton(() => {
    return new NewShapeModeController(
        canvasStateStore(),
        appStateStore(),
        appController(),
        historyManager(),
        viewportStore(),
        snapGuideStore(),
        gestureRecognizer(),
    );
});

const newLineModeController = singleton(() => {
    return new NewLineModeController(
        canvasStateStore(),
        appStateStore(),
        appController(),
        historyManager(),
        viewportStore(),
        gestureRecognizer(),
    );
});

const newTextModeController = singleton(() => {
    return new NewTextModeController(
        canvasStateStore(),
        appStateStore(),
        appController(),
    );
});

const editTextModeController = singleton(() => {
    return new EditTextModeController(
        appController(),
        selectModeController(),
        canvasStateStore(),
    );
});

export function createController(): AppController {
    return appController()
        .addModeController(selectModeController())
        .addModeController(newShapeModeController())
        .addModeController(newLineModeController())
        .addModeController(newTextModeController())
        .addModeController(editTextModeController());
}
