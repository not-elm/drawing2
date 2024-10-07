import { Store } from "../lib/Store";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextBlockSizingMode } from "../model/TextBlockSizingMode";

interface AppState {
    readonly mode: Mode;
    readonly defaultColorId: ColorId;
    readonly defaultFillMode: FillMode;
    readonly defaultTextAlignX: TextAlignment;
    readonly defaultTextAlignY: TextAlignment;
    readonly defaultLineEndType1: LineEndType;
    readonly defaultLineEndType2: LineEndType;
    readonly defaultTextBlockTextAlignment: TextAlignment;
    readonly defaultTextBlockSizingMode: TextBlockSizingMode;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: { type: "select" },
            defaultColorId: 0,
            defaultFillMode: "none",
            defaultTextAlignX: "center",
            defaultTextAlignY: "center",
            defaultLineEndType1: "none",
            defaultLineEndType2: "arrow",
            defaultTextBlockTextAlignment: "start",
            defaultTextBlockSizingMode: "content",
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

    setDefaultLineEnd(lineEnd: 1 | 2, lineEndType: LineEndType) {
        this.setState({
            ...this.state,
            [`defaultLineEndType${lineEnd}`]: lineEndType,
        });
    }

    setDefaultTextBlockTextAlignment(alignment: TextAlignment) {
        this.setState({
            ...this.state,
            defaultTextBlockTextAlignment: alignment,
        });
    }

    setDefaultTextBlockSizingMode(sizingMode: TextBlockSizingMode) {
        this.setState({
            ...this.state,
            defaultTextBlockSizingMode: sizingMode,
        });
    }

    setMode(mode: Mode) {
        this.setState({ ...this.state, mode });
    }
}
