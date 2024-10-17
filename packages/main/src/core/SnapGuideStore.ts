import { Store } from "../lib/Store";
import type { SnapGuide } from "./SnapEntry";

interface SnapGuideState {
    guide: SnapGuide | null;
}

export class SnapGuideStore extends Store<SnapGuideState> {
    constructor() {
        super({
            guide: null,
        });
    }

    setSnapGuide(guide: SnapGuide | null) {
        this.setState({ guide });
    }

    clear() {
        this.setSnapGuide(null);
    }
}
