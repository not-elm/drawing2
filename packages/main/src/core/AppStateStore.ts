import type * as csstype from "csstype";
import { Store } from "../lib/Store";
import type { Mode } from "./model/Mode";
import type { TextEntitySizingMode } from "./model/TextEntitySizingMode";

interface AppState {
    readonly mode: Mode;
    readonly cursor: csstype.Property.Cursor;
    readonly defaultLineEndType1: LineEndType;
    readonly defaultLineEndType2: LineEndType;
    readonly defaultTextEntitySizingMode: TextEntitySizingMode;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: { type: "select" },
            cursor: "default",
            defaultLineEndType1: "none",
            defaultLineEndType2: "arrow",
            defaultTextEntitySizingMode: "content",
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

    setMode(mode: Mode) {
        this.setState({ ...this.state, mode });
    }
}
