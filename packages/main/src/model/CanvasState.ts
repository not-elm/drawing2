import { getBoundingRectOfLine } from "../geo/Line";
import { getBoundingRectOfPoint } from "../geo/Point";
import { type Rect, getBoundingRectOfRect, unionRect } from "../geo/Rect";
import { dataclass } from "../lib/dataclass";
import { isNotNullish } from "../lib/isNullish";
import type { Obj, Page } from "./Page";

export class CanvasState extends dataclass<{
    readonly page: Page;
    readonly selectedObjectIds: string[];
}>() {
    setPage(page: Page): CanvasState {
        return this.copy({
            page,
            selectedObjectIds: this.selectedObjectIds.filter(
                (id) => id in page.objects,
            ),
        });
    }

    select(id: string): CanvasState {
        return this.setSelectedObjectIds([...this.selectedObjectIds, id]);
    }

    selectAll(): CanvasState {
        return this.setSelectedObjectIds(this.page.objectIds);
    }

    unselect(id: string): CanvasState {
        return this.setSelectedObjectIds(
            this.selectedObjectIds.filter((i) => i !== id),
        );
    }

    unselectAll(): CanvasState {
        return this.setSelectedObjectIds([]);
    }

    setSelectedObjectIds(selectedObjectIds: string[]): CanvasState {
        return this.copy({
            selectedObjectIds: selectedObjectIds.filter(
                (id) => id in this.page.objects,
            ),
        });
    }

    getSelectionRect(): Rect | null {
        const rects = this.getSelectedObjects().map((obj) => {
            switch (obj.type) {
                case "shape":
                    return getBoundingRectOfRect(obj);
                case "line":
                    return getBoundingRectOfLine(obj);
                case "point":
                    return getBoundingRectOfPoint(obj);
            }
        });
        let rect = rects.shift();
        if (rect === undefined) return null;

        for (const r of rects) {
            rect = unionRect(rect, r);
        }
        return rect;
    }

    getSelectedObjects(): Obj[] {
        return this.selectedObjectIds
            .map((id) => this.page.objects[id])
            .filter(isNotNullish);
    }
}
