import type { App } from "../App";
import {
    type CanvasPointerEvent,
    type ModeChangeEvent,
    ModeController,
} from "../ModeController";
import { cell } from "../cell/ICell";
import { Point } from "../shape/Point";
import { Rect } from "../shape/Shape";
import { SelectEntityModeController } from "./SelectEntityModeController";

export class SelectByBrushModeController extends ModeController {
    static readonly type = "select-by-brush";

    readonly brushRect = cell<Rect | null>(null);
    private startPoint = new Point(0, 0);
    private originalSelectedEntityIds: ReadonlySet<string> = new Set<string>();

    constructor(protected readonly app: App) {
        super();
    }

    onBeforeEnterMode(app: App, ev: ModeChangeEvent): void {
        this.startPoint = app.pointerPosition.get();
        this.brushRect.set(Rect.fromPoints(this.startPoint, this.startPoint));
        this.originalSelectedEntityIds = app.canvas.selectedEntityIds.get();
    }

    onPointerMove(app: App, ev: CanvasPointerEvent): void {
        const newRect = Rect.fromPoints(this.startPoint, ev.point);
        this.brushRect.set(newRect);

        const newSelectedEntityIds = new Set(this.originalSelectedEntityIds);
        for (const entity of app.canvas.page.get().entities.values()) {
            const shape = app.entityHandle.getShape(entity);
            if (shape.isOverlapWith(newRect)) {
                newSelectedEntityIds.add(entity.id);
            }
        }

        app.canvas.setSelectedEntityIds(newSelectedEntityIds);
    }

    onPointerUp(app: App, ev: CanvasPointerEvent): void {
        app.setMode(SelectEntityModeController.type);
    }

    onBeforeExitMode(app: App, ev: ModeChangeEvent) {
        this.brushRect.set(null);
    }
}
