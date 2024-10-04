import { Store } from "../lib/Store";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
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

    isTextEditing(shapeId: string): boolean {
        return (
            this.state.mode === "text" &&
            this.canvasStateStore.getState().selectedObjectIds.includes(shapeId)
        );
    }
}
