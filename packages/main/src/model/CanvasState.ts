import { type Rect, unionRectAll } from "../geo/Rect";
import { dataclass } from "../lib/dataclass";
import { isNotNullish } from "../lib/isNullish";
import { type Entity, type Page, getBoundingRect } from "./Page";

export class CanvasState extends dataclass<{
    readonly page: Page;
    readonly selectedEntityIds: string[];
}>() {
    setPage(page: Page): CanvasState {
        return this.copy({
            page,
            selectedEntityIds: [...this.selectedEntityIds].filter(
                (id) => id in page.entities,
            ),
        });
    }

    select(id: string): CanvasState {
        if (this.selectedEntityIds.includes(id)) {
            return this;
        }

        return this.setSelectedEntityIds([...this.selectedEntityIds, id]);
    }

    selectAll(): CanvasState {
        return this.setSelectedEntityIds(this.page.entityIds);
    }

    unselect(id: string): CanvasState {
        return this.setSelectedEntityIds(
            this.selectedEntityIds.filter((i) => i !== id),
        );
    }

    unselectAll(): CanvasState {
        return this.setSelectedEntityIds([]);
    }

    setSelectedEntityIds(selectedEntityIds: string[]): CanvasState {
        return this.copy({
            selectedEntityIds: selectedEntityIds.filter(
                (id) => id in this.page.entities,
            ),
        });
    }

    getSelectionRect(): Rect | null {
        const rects = this.getSelectedEntities().map(getBoundingRect);
        if (rects.length === 0) return null;
        return unionRectAll(rects);
    }

    getSelectedEntities(): Entity[] {
        return [...this.selectedEntityIds]
            .map((id) => this.page.entities[id])
            .filter(isNotNullish);
    }
}
