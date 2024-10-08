import { getBoundingRectOfLine } from "../geo/Line";
import { type Rect, getBoundingRectOfRect, unionRect } from "../geo/Rect";
import { dataclass } from "../lib/dataclass";
import { isNotNullish } from "../lib/isNullish";
import type { Block, Page } from "./Page";

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
        const rects = this.getSelectedBlocks().map((obj) => {
            switch (obj.type) {
                case "shape":
                case "text":
                    return getBoundingRectOfRect(obj);
                case "line":
                    return getBoundingRectOfLine(obj);
            }
        });
        let rect = rects.shift();
        if (rect === undefined) return null;

        for (const r of rects) {
            rect = unionRect(rect, r);
        }
        return rect;
    }

    getSelectedBlocks(): Block[] {
        return [...this.selectedBlockIds]
            .map((id) => this.page.blocks[id])
            .filter(isNotNullish);
    }
}
