import type { Rect } from "../geo/Rect";
import { Store } from "../lib/Store";

export class BrushStore extends Store<{
    active: boolean;
    rect: Rect;
}> {
    constructor() {
        super({
            active: false,
            rect: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
            },
        });
    }

    setActive(active: boolean) {
        this.setState({ ...this.state, active });
    }

    setRect(rect: Rect) {
        this.setState({ ...this.state, rect });
    }
}
