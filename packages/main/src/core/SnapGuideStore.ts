import { Store } from "../lib/Store";
import type { SnapGuide } from "./SnapEntry";

interface SnapGuideState {
    guides: Map<string, SnapGuide>;
}

export class SnapGuideStore extends Store<SnapGuideState> {
    constructor() {
        super({
            guides: new Map(),
        });
    }

    setSnapGuide(key: string, guide: SnapGuide) {
        const newGuides = new Map(this.state.guides);
        newGuides.set(key, guide);
        this.setState({ guides: newGuides });
    }

    deleteSnapGuide(key: string) {
        const newGuides = new Map(this.state.guides);
        newGuides.delete(key);
        this.setState({ guides: newGuides });
    }
}
