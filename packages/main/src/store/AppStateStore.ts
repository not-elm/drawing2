import { Store } from "../lib/Store";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import { PropertyPanelState } from "../model/PropertyPanelState";
import type { TextAlignment } from "../model/TextAlignment";
import type { CanvasStateStore } from "./CanvasStateStore";

interface AppState {
    readonly mode: Mode;
    readonly defaultColorId: ColorId;
    readonly defaultFillMode: FillMode;
    readonly defaultTextAlignX: TextAlignment;
    readonly defaultTextAlignY: TextAlignment;
}

export class AppStateStore extends Store<AppState> {
    constructor(private readonly canvasStateStore: CanvasStateStore) {
        super({
            mode: "select",
            defaultColorId: 0,
            defaultFillMode: "none",
            defaultTextAlignX: "center",
            defaultTextAlignY: "center",
        });
    }

    setDefaultTextAlign(textAlignX: TextAlignment, textAlignY: TextAlignment) {
        this.setState({
            ...this.state,
            defaultTextAlignX: textAlignX,
            defaultTextAlignY: textAlignY,
        });
    }

    setDefaultColor(colorId: ColorId) {
        this.setState({ ...this.state, defaultColorId: colorId });
    }

    setDefaultFillMode(fillMode: FillMode) {
        this.setState({ ...this.state, defaultFillMode: fillMode });
    }

    setMode(mode: Mode) {
        this.setState({ ...this.state, mode });
    }

    getPropertyPanelState(): PropertyPanelState {
        const selectedObjects = this.canvasStateStore
            .getState()
            .getSelectedObjects();
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

        return new PropertyPanelState({
            colorSectionVisible: true,
            colorId:
                colorIds.size === 0
                    ? this.state.defaultColorId
                    : colorIds.size === 1
                      ? [...colorIds][0]
                      : null,
            fillModeSectionVisible:
                selectedShapes.length > 0 || selectedLines.length === 0,
            fillMode:
                fillModes.size === 0
                    ? this.state.defaultFillMode
                    : fillModes.size === 1
                      ? [...fillModes][0]
                      : null,
            textAlignSectionVisible:
                selectedShapes.length > 0 || selectedLines.length === 0,
            textAlignX:
                alignXs.size === 0
                    ? this.state.defaultTextAlignX
                    : alignXs.size === 1
                      ? [...alignXs][0]
                      : null,
            textAlignY:
                alignYs.size === 0
                    ? this.state.defaultTextAlignY
                    : alignYs.size === 1
                      ? [...alignYs][0]
                      : null,
            orderSectionVisible:
                selectedShapes.length > 0 || selectedLines.length > 0,
        });
    }

    isTextEditing(shapeId: string): boolean {
        return (
            this.state.mode === "text" &&
            this.canvasStateStore.getState().selectedObjectIds.includes(shapeId)
        );
    }
}
