import { Store } from "../lib/Store";
import type { FillMode } from "../model/FillMode";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextBlockSizingMode } from "../model/TextBlockSizingMode";
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
    readonly lineEndType1: LineEndType | null;
    readonly lineEndType2: LineEndType | null;

    readonly textBlockSizingModeSectionVisible: boolean;
    readonly textBlockSizingMode: TextBlockSizingMode | null;
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
            lineEndType1: null,
            lineEndType2: null,
            textBlockSizingModeSectionVisible: true,
            textBlockSizingMode: null,
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

        const selectedBlocks = canvasState.getSelectedBlocks();
        const selectedShapes = selectedBlocks.filter(
            (obj) => obj.type === "shape",
        );
        const selectedLines = selectedBlocks.filter(
            (obj) => obj.type === "line",
        );
        const selectedTexts = selectedBlocks.filter(
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
            ...selectedLines.map((shape) => shape.colorId),
        ]);
        const fillModes = new Set([
            ...selectedShapes.map((shape) => shape.fillMode),
        ]);
        const lineEndType1Set = new Set(
            selectedLines.map((line) => line.endType1),
        );
        const lineEndType2Set = new Set(
            selectedLines.map((line) => line.endType2),
        );
        const textBlockSizingModes = new Set(
            selectedTexts.map((text) => text.sizingMode),
        );

        this.setState({
            colorSectionVisible: true,
            colorId:
                colorIds.size === 0
                    ? appState.defaultColorId
                    : colorIds.size === 1
                      ? [...colorIds][0]
                      : null,
            fillModeSectionVisible:
                selectedShapes.length > 0 || appState.mode.type === "shape",
            fillMode:
                fillModes.size === 0
                    ? appState.defaultFillMode
                    : fillModes.size === 1
                      ? [...fillModes][0]
                      : null,
            textAlignSectionVisible:
                selectedShapes.length > 0 ||
                selectedTexts.length > 0 ||
                appState.mode.type === "shape" ||
                appState.mode.type === "new-text",
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
                selectedShapes.length > 0 || selectedLines.length > 0,
            lineEndTypeSectionVisible:
                selectedLines.length > 0 || appState.mode.type === "line",
            lineEndType1:
                lineEndType1Set.size === 0
                    ? appState.defaultLineEndType1
                    : lineEndType1Set.size === 1
                      ? [...lineEndType1Set][0]
                      : null,
            lineEndType2:
                lineEndType2Set.size === 0
                    ? appState.defaultLineEndType2
                    : lineEndType2Set.size === 1
                      ? [...lineEndType2Set][0]
                      : null,
            textBlockSizingModeSectionVisible:
                selectedTexts.length > 0 ||
                appState.mode.type === "new-text" ||
                appState.mode.type === "text",
            textBlockSizingMode:
                textBlockSizingModes.size === 0
                    ? appState.defaultTextBlockSizingMode
                    : textBlockSizingModes.size === 1
                      ? [...textBlockSizingModes][0]
                      : null,
        });
    }
}
