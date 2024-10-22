import type * as csstype from "csstype";
import { Store } from "../lib/Store";
import { SelectEntityModeController } from "./SelectEntityModeController";

interface AppState {
    readonly mode: string;
    readonly cursor: csstype.Property.Cursor;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: SelectEntityModeController.MODE_NAME,
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
