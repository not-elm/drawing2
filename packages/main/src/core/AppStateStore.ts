import type * as csstype from "csstype";
import { Store } from "../lib/Store";

interface AppState {
    readonly mode: string;
    readonly cursor: csstype.Property.Cursor;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: "select-entity",
            cursor: "default",
        });
    }

    setCursor(cursor: csstype.Property.Cursor) {
        this.setState({ ...this.state, cursor });
    }

    setMode(mode: string) {
        this.setState({ ...this.state, mode });
    }
}
