import { Store } from "../lib/Store";
import type { FillMode } from "../model/FillMode";
import type { TextAlignment } from "../model/TextAlignment";
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
        });

        this.canvasStateStore.addListener(() => this.update());
        this.appStateStore.addListener(() => this.update());
        this.update();
    }

    private update() {
        const appState = this.appStateStore.getState();
        const canvasState = this.canvasStateStore.getState();

        const selectedObjects = canvasState.getSelectedObjects();
        const selectedShapes = selectedObjects.filter(
            (obj) => obj.type === "shape",
        );
        const selectedLines = selectedObjects.filter(
            (obj) => obj.type === "line",
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

        this.setState({
            colorSectionVisible: true,
            colorId:
                colorIds.size === 0
                    ? appState.defaultColorId
                    : colorIds.size === 1
                      ? [...colorIds][0]
                      : null,
            fillModeSectionVisible:
                selectedShapes.length > 0 || selectedLines.length === 0,
            fillMode:
                fillModes.size === 0
                    ? appState.defaultFillMode
                    : fillModes.size === 1
                      ? [...fillModes][0]
                      : null,
            textAlignSectionVisible:
                selectedShapes.length > 0 || selectedLines.length === 0,
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
        });
    }
}
