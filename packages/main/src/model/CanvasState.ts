import { type Rect, unionRectAll } from "../geo/Rect";
import { dataclass } from "../lib/dataclass";
import { isNotNullish } from "../lib/isNullish";
import { type Block, type Page, getBoundingRect } from "./Page";

export class CanvasState extends dataclass<{
    readonly page: Page;
    readonly selectedBlockIds: string[];
}>() {
    setPage(page: Page): CanvasState {
        return this.copy({
            page,
            selectedBlockIds: [...this.selectedBlockIds].filter(
                (id) => id in page.blocks,
            ),
        });
    }

    select(id: string): CanvasState {
        if (this.selectedBlockIds.includes(id)) {
            return this;
        }

        return this.setSelectedBlockIds([...this.selectedBlockIds, id]);
    }

    selectAll(): CanvasState {
        return this.setSelectedBlockIds(this.page.blockIds);
    }

    unselect(id: string): CanvasState {
        return this.setSelectedBlockIds(
            this.selectedBlockIds.filter((i) => i !== id),
        );
    }

    unselectAll(): CanvasState {
        return this.setSelectedBlockIds([]);
    }

    setSelectedBlockIds(selectedBlockIds: string[]): CanvasState {
        return this.copy({
            selectedBlockIds: selectedBlockIds.filter(
                (id) => id in this.page.blocks,
            ),
        });
    }

    getSelectionRect(): Rect | null {
        const rects = this.getSelectedBlocks().map(getBoundingRect);
        if (rects.length === 0) return null;
        return unionRectAll(rects);
    }

    getSelectedBlocks(): Block[] {
        return [...this.selectedBlockIds]
            .map((id) => this.page.blocks[id])
            .filter(isNotNullish);
    }
}
