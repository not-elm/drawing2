import { Store } from "../lib/Store";
import type { FillMode } from "../model/FillMode";
import type { StrokeStyle } from "../model/StrokeStyle";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextEntitySizingMode } from "../model/TextEntitySizingMode";
import type { AppStateStore } from "./AppStateStore";
import type { CanvasStateStore } from "./CanvasStateStore";

interface PropertyPanelState {
    readonly colorSectionVisible: boolean;
    readonly colorId: number | null;

    readonly fillModeSectionVisible: boolean;
    readonly fillMode: FillMode | null;

    readonly textAlignSectionVisible: boolean;
    readonly textAlignX: TextAlignment | null;
    readonly textAlignY: TextAlignment | null;

    readonly orderSectionVisible: boolean;

    readonly lineEndTypeSectionVisible: boolean;

    readonly textEntityTextAlignmentSectionVisible: boolean;
    readonly textEntityTextAlignment: TextAlignment | null;

    readonly textEntitySizingModeSectionVisible: boolean;
    readonly textEntitySizingMode: TextEntitySizingMode | null;

    readonly strokeStyleSectionVisible: boolean;
    readonly strokeStyle: StrokeStyle | null;
}

export class PropertyPanelStateStore extends Store<PropertyPanelState> {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly appStateStore: AppStateStore,
    ) {
        super({
            colorSectionVisible: true,
            colorId: null,
            fillModeSectionVisible: true,
            fillMode: null,
            textAlignSectionVisible: true,
            textAlignX: null,
            textAlignY: null,
            orderSectionVisible: true,
            lineEndTypeSectionVisible: true,
            textEntityTextAlignmentSectionVisible: true,
            textEntityTextAlignment: null,
            textEntitySizingModeSectionVisible: true,
            textEntitySizingMode: null,
            strokeStyleSectionVisible: true,
            strokeStyle: null,
        });

        this.canvasStateStore.addListener(() => this.update());
        this.appStateStore.addListener(() => this.update());
        this.update();
    }

    addListener(callback: (state: PropertyPanelState) => void) {
        super.addListener(callback);
    }

    private update() {
        const appState = this.appStateStore.getState();
        const canvasState = this.canvasStateStore.getState();

        const selectedEntitys = canvasState.getSelectedEntities();
        const selectedShapes = selectedEntitys.filter(
            (obj) => obj.type === "shape",
        );
        const selectedPaths = selectedEntitys.filter(
            (obj) => obj.type === "path",
        );
        const selectedTexts = selectedEntitys.filter(
            (obj) => obj.type === "text",
        );

        const alignXs = new Set(
            selectedShapes.map((shape) => shape.textAlignX),
        );
        const alignYs = new Set(
            selectedShapes.map((shape) => shape.textAlignY),
        );
        const colorIds = new Set([
            ...selectedShapes.map((shape) => shape.colorId),
            ...selectedPaths.map((shape) => shape.colorId),
        ]);
        const fillModes = new Set([
            ...selectedShapes.map((shape) => shape.fillMode),
        ]);
        const textEntityTextAlignments = new Set(
            selectedTexts.map((text) => text.textAlignment),
        );
        const textEntitySizingModes = new Set(
            selectedTexts.map((text) => text.sizingMode),
        );
        const strokeStyles = new Set([
            ...selectedPaths.map((line) => line.strokeStyle),
            ...selectedShapes.map((shape) => shape.strokeStyle),
        ]);

        this.setState({
            colorSectionVisible: true,
            colorId:
                colorIds.size === 0
                    ? appState.defaultColorId
                    : colorIds.size === 1
                      ? [...colorIds][0]
                      : null,
            fillModeSectionVisible:
                selectedShapes.length > 0 || appState.mode.type === "new-shape",
            fillMode:
                fillModes.size === 0
                    ? appState.defaultFillMode
                    : fillModes.size === 1
                      ? [...fillModes][0]
                      : null,
            textAlignSectionVisible:
                selectedShapes.length > 0 || appState.mode.type === "new-shape",
            textAlignX:
                alignXs.size === 0
                    ? appState.defaultTextAlignX
                    : alignXs.size === 1
                      ? [...alignXs][0]
                      : null,
            textAlignY:
                alignYs.size === 0
                    ? appState.defaultTextAlignY
                    : alignYs.size === 1
                      ? [...alignYs][0]
                      : null,
            orderSectionVisible:
                selectedShapes.length > 0 || selectedPaths.length > 0,
            lineEndTypeSectionVisible:
                selectedPaths.length > 0 || appState.mode.type === "new-path",
            textEntityTextAlignmentSectionVisible:
                (selectedShapes.length === 0 && selectedTexts.length > 0) ||
                appState.mode.type === "new-text" ||
                appState.mode.type === "edit-text",
            textEntityTextAlignment:
                textEntityTextAlignments.size === 0
                    ? appState.defaultTextEntityTextAlignment
                    : textEntityTextAlignments.size === 1
                      ? [...textEntityTextAlignments][0]
                      : null,
            textEntitySizingModeSectionVisible:
                selectedTexts.length > 0 ||
                appState.mode.type === "new-text" ||
                appState.mode.type === "edit-text",
            textEntitySizingMode:
                textEntitySizingModes.size === 0
                    ? appState.defaultTextEntitySizingMode
                    : textEntitySizingModes.size === 1
                      ? [...textEntitySizingModes][0]
                      : null,
            strokeStyleSectionVisible:
                selectedPaths.length > 0 ||
                appState.mode.type === "new-path" ||
                selectedShapes.length > 0 ||
                appState.mode.type === "new-shape",
            strokeStyle:
                strokeStyles.size === 0
                    ? appState.defaultStrokeStyle
                    : strokeStyles.size === 1
                      ? [...strokeStyles][0]
                      : null,
        });
    }
}
