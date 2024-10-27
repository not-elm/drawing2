import { Store } from "../lib/Store";
import type { CornerRoundHandleData } from "./SelectEntityModeController";

import { Rect } from "./geo/Shape";

export class SelectEntityModeStateStore extends Store<{
    brushRect: Rect | null;
    visibleCornerRoundHandles: CornerRoundHandleData[];
}> {
    constructor() {
        super({
            brushRect: Rect.of(0, 0, 0, 0),
            visibleCornerRoundHandles: [],
        });
    }

    setBrushRect(brushRect: Rect | null) {
        this.setState({ ...this.state, brushRect });
    }

    setVisibleCornerRoundHandles(
        visibleCornerRoundHandles: CornerRoundHandleData[],
    ) {
        this.setState({ ...this.state, visibleCornerRoundHandles });
    }
}
