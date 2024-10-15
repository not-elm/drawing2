import type * as csstype from "csstype";
import { Store } from "../lib/Store";

import type { Mode } from "./ModeController";

interface AppState {
    readonly mode: Mode;
    readonly cursor: csstype.Property.Cursor;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: { type: "select" },
            cursor: "default",
        });
    }

    setCursor(cursor: csstype.Property.Cursor) {
        this.setState({ ...this.state, cursor });
    }

    setMode(mode: Mode) {
        this.setState({ ...this.state, mode });
    }
}
