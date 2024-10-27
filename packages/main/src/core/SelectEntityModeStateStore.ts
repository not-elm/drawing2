import { Store } from "../lib/Store";

import { Rect } from "./shape/Shape";

export class SelectEntityModeStateStore extends Store<{
    brushRect: Rect | null;
}> {
    constructor() {
        super({
            brushRect: Rect.of(0, 0, 0, 0),
        });
    }

    setBrushRect(brushRect: Rect | null) {
        this.setState({ ...this.state, brushRect });
    }
}
