import { Rect } from "../geo/Rect";
import { Store } from "../lib/Store";

export class BrushStore extends Store<{
    active: boolean;
    rect: Rect;
}> {
    constructor() {
        super({
            active: false,
            rect: Rect.of(0, 0, 0, 0),
        });
    }

    setActive(active: boolean) {
        this.setState({ ...this.state, active });
    }

    setRect(rect: Rect) {
        this.setState({ ...this.state, rect });
    }
}
