import { Store } from "../lib/Store";
import { Rect } from "../lib/geo/Rect";
import type { CornerRoundHandleData } from "./SelectEntityModeController";

// TODO: Rename
export class BrushStore extends Store<{
    active: boolean;
    rect: Rect;
    visibleCornerRoundHandles: CornerRoundHandleData[];
}> {
    constructor() {
        super({
            active: false,
            rect: Rect.of(0, 0, 0, 0),
            visibleCornerRoundHandles: [],
        });
    }

    setActive(active: boolean) {
        this.setState({ ...this.state, active });
    }

    setRect(rect: Rect) {
        this.setState({ ...this.state, rect });
    }

    setVisibleCornerRoundHandles(
        visibleCornerRoundHandles: CornerRoundHandleData[],
    ) {
        this.setState({ ...this.state, visibleCornerRoundHandles });
    }
}
