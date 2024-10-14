import type * as csstype from "csstype";
import { Store } from "../../lib/Store";
import type { Mode } from "../model/Mode";
import type { StrokeStyle } from "../model/StrokeStyle";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextEntitySizingMode } from "../model/TextEntitySizingMode";

interface AppState {
    readonly mode: Mode;
    readonly cursor: csstype.Property.Cursor;
    readonly defaultLineEndType1: LineEndType;
    readonly defaultLineEndType2: LineEndType;
    readonly defaultTextEntityTextAlignment: TextAlignment;
    readonly defaultTextEntitySizingMode: TextEntitySizingMode;
    readonly defaultStrokeStyle: StrokeStyle;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: { type: "select" },
            cursor: "default",
            defaultLineEndType1: "none",
            defaultLineEndType2: "arrow",
            defaultTextEntityTextAlignment: "start",
            defaultTextEntitySizingMode: "content",
            defaultStrokeStyle: "solid",
        });
    }

    setCursor(cursor: csstype.Property.Cursor) {
        this.setState({ ...this.state, cursor });
    }
    setDefaultLineEnd(lineEnd: 1 | 2, lineEndType: LineEndType) {
        this.setState({
            ...this.state,
            [`defaultLineEndType${lineEnd}`]: lineEndType,
        });
    }

    setDefaultTextEntityTextAlignment(alignment: TextAlignment) {
        this.setState({
            ...this.state,
            defaultTextEntityTextAlignment: alignment,
        });
    }

    setDefaultTextEntitySizingMode(sizingMode: TextEntitySizingMode) {
        this.setState({
            ...this.state,
            defaultTextEntitySizingMode: sizingMode,
        });
    }

    setDefaultStrokeStyle(strokeStyle: StrokeStyle) {
        this.setState({
            ...this.state,
            defaultStrokeStyle: strokeStyle,
        });
    }

    setMode(mode: Mode) {
        this.setState({ ...this.state, mode });
    }
}
