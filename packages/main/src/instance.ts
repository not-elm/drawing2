import { AppController } from "./core/AppController";
import { EntityHandleMap } from "./core/EntityHandleMap";
import { GestureRecognizer } from "./core/GestureRecognizer";
import { HistoryManager } from "./core/HistoryManager";
import { EditTextModeController } from "./core/ModeController/EditTextModeController";
import { SelectModeController } from "./core/ModeController/SelectModeController";
import { URLQueryRestoreViewportService } from "./core/URLQueryRestoreViewportService";
import { AppStateStore } from "./core/store/AppStateStore";
import { BrushStore } from "./core/store/BrushStore";
import { CanvasStateStore } from "./core/store/CanvasStateStore";
import { PropertyPanelStateStore } from "./core/store/PropertyPanelStateStore";
import { SnapGuideStore } from "./core/store/SnapGuideStore";
import { ViewportStore } from "./core/store/ViewportStore";
import { ColorPropertySection } from "./core/view/PropertySection/ColorPropertySection/ColorPropertySection";
import { FillModePropertySection } from "./core/view/PropertySection/FillModePropertySection/FillModePropertySection";
import { OrderPropertySection } from "./core/view/PropertySection/OrderPropertySection/OrderPropertySection";
import { PropertyPanel } from "./core/view/PropertySection/PropertyPanel";
import { StrokeStylePropertySection } from "./core/view/PropertySection/StrokeStylePropertySection/StrokeStylePropertySection";
import { TextAlignmentPropertySection } from "./core/view/PropertySection/TextAlignmentPropertySection/TextAlignmentPropertySection";
import { ToolBar } from "./core/view/Toolbar/ToolBar";
import { NewPathModeController } from "./entity/PathEntity/NewPathModeController";
import { PathEntityHandle } from "./entity/PathEntity/PathEntityHandle";
import { PathEntityViewHandle } from "./entity/PathEntity/PathEntityViewHandle";
import { NewShapeModeController } from "./entity/ShapeEntity/NewShapeModeController";
import { ShapeEntityHandle } from "./entity/ShapeEntity/ShapeEntityHandle";
import { ShapeEntityViewHandle } from "./entity/ShapeEntity/ShapeEntityViewHandle";
import { NewTextModeController } from "./entity/TextEntity/NewTextModeController";
import { TextEntityHandle } from "./entity/TextEntity/TextEntityHandle";
import { TextEntityViewHandle } from "./entity/TextEntity/TextEntityViewHandle";
import { singleton } from "./lib/singleton";
import { EntityViewHandleMap } from "./react/EntityViewMap/EntityViewHandleMap";

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
            entityHandleMap(),
        ),
);

export const entityHandleMap = singleton(() => {
    return new EntityHandleMap()
        .register(new PathEntityHandle())
        .register(new ShapeEntityHandle())
        .register(new TextEntityHandle());
});

export const entityViewHandleMap = singleton(() => {
    return new EntityViewHandleMap(appController());
});

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

const newPathModeController = singleton(() => {
    return new NewPathModeController(
        canvasStateStore(),
        appStateStore(),
        appController(),
        historyManager(),
        gestureRecognizer(),
    );
});

const newTextModeController = singleton(() => {
    return new NewTextModeController(appController(), canvasStateStore());
});

const editTextModeController = singleton(() => {
    return new EditTextModeController(appController(), selectModeController());
});

export const colorPropertySection = singleton(() => {
    return new ColorPropertySection(canvasStateStore());
});

export const textAlignmentPropertySection = singleton(() => {
    return new TextAlignmentPropertySection(canvasStateStore());
});

export const fillModePropertySection = singleton(() => {
    return new FillModePropertySection(canvasStateStore());
});

export const orderPropertySection = singleton(() => {
    return new OrderPropertySection(canvasStateStore());
});

export const strokeStylePropertySection = singleton(() => {
    return new StrokeStylePropertySection(canvasStateStore());
});

export const propertySection = singleton(() => {
    return new PropertyPanel()
        .addSection(colorPropertySection())
        .addSection(textAlignmentPropertySection())
        .addSection(fillModePropertySection())
        .addSection(orderPropertySection())
        .addSection(strokeStylePropertySection());

    /*{state.textEntitySizingModeSectionVisible && <SizingModeSection />}*/
});

export const toolBar = singleton(() => {
    return new ToolBar(appStateStore())
        .addButton("Select", { type: "select" })
        .addButton("Shape", { type: "new-shape" })
        .addButton("Line", { type: "new-path" })
        .addButton("Text", { type: "new-text" });
});

export function setUp(): AppController {
    entityViewHandleMap()
        .register(new PathEntityViewHandle())
        .register(new ShapeEntityViewHandle())
        .register(new TextEntityViewHandle());

    return appController()
        .addModeController(selectModeController())
        .addModeController(newShapeModeController())
        .addModeController(newPathModeController())
        .addModeController(newTextModeController())
        .addModeController(editTextModeController())
        .registerEntityHandle(new PathEntityHandle())
        .registerEntityHandle(new ShapeEntityHandle())
        .registerEntityHandle(new TextEntityHandle());
}
