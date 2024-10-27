import type * as csstype from "csstype";
import { Store } from "../lib/Store";
import { SelectEntityModeController } from "./SelectEntityModeController";
import { Point } from "./shape/Point";

interface AppState {
    readonly mode: string;
    readonly cursor: csstype.Property.Cursor;
    readonly pointerPosition: Point;
}

export class AppStateStore extends Store<AppState> {
    constructor() {
        super({
            mode: SelectEntityModeController.MODE_NAME,
            cursor: "default",
            pointerPosition: new Point(0, 0),
        });
    }

    setCursor(cursor: csstype.Property.Cursor) {
        this.setState({ ...this.state, cursor });
    }

    setMode(mode: string) {
        this.setState({ ...this.state, mode });
    }

    setPointerPosition(point: Point) {
        this.setState({ ...this.state, pointerPosition: point });
    }
}
