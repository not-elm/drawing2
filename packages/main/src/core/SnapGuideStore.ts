import type { SnapGuide } from "./SnapEntry";
import { atom } from "./atom/Atom";

export class SnapGuideStore {
    readonly state = atom({
        guides: new Map<string, SnapGuide>(),
    });

    setSnapGuide(key: string, guide: SnapGuide) {
        const newGuides = new Map(this.state.get().guides);
        newGuides.set(key, guide);
        this.state.set({ guides: newGuides });
    }

    deleteSnapGuide(key: string) {
        const newGuides = new Map(this.state.get().guides);
        newGuides.delete(key);
        this.state.set({ guides: newGuides });
    }
}
