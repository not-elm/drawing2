import { assert } from "../lib/assert";
import type { Point } from "../lib/geo/Point";
import { Rect } from "../lib/geo/Rect";
import { testHitEntities } from "../lib/testHitEntities";
import type { App } from "./App";
import { BrushStore } from "./BrushStore";
import type { Entity } from "./Entity";
import {
    type CanvasPointerEvent,
    type Mode,
    ModeController,
} from "./ModeController";
import type { Page } from "./Page";
import {
    ScaleSelectionTransformController,
    TranslateSelectionTransformController,
} from "./SelectionTransformController";
import { setupBrushSelectPointerEventHandlers } from "./setupBrushSelectPointerEventHandlers";
import { setupSelectionTransformPointerEventHandlers } from "./setupSelectionTransformPointerEventHandlers";

export class SelectEntityModeController extends ModeController {
    readonly brushStore = new BrushStore();

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const selectionHandle = this.getSelectionHandleType(app, ev.point);
        if (selectionHandle !== null) {
            this.onSelectionPointerDown(app, ev, selectionHandle);
            return;
        }

        const hitResult = testHitEntities(
            app.canvasStateStore.getState(),
            ev.point,
            app.viewportStore.getState().scale,
        );
        const result = hitResult.entities.at(0);
        if (result !== undefined) {
            this.onEntityPointerDown(app, ev, result.target);
            return;
        }

        if (!ev.shiftKey) app.unselectAll();

        setupBrushSelectPointerEventHandlers(app, ev, this.brushStore);
    }

    onCanvasDoubleClick(app: App, ev: CanvasPointerEvent) {
        app.setMode({ type: "new-text" });
        app.getModeController().onCanvasPointerDown(app, ev);
    }

    onMouseMove(app: App, point: Point) {
        const selectionHandle = this.getSelectionHandleType(app, point);
        if (selectionHandle !== null) {
            switch (selectionHandle.type) {
                case "SelectionRect.TopLeftHandle":
                    app.appStateStore.setCursor("nwse-resize");
                    break;
                case "SelectionRect.TopHandle":
                    app.appStateStore.setCursor("ns-resize");
                    break;
                case "SelectionRect.TopRightHandle":
                    app.appStateStore.setCursor("nesw-resize");
                    break;
                case "SelectionRect.LeftHandle":
                    app.appStateStore.setCursor("ew-resize");
                    break;
                case "SelectionRect.CenterHandle":
                    app.appStateStore.setCursor("default");
                    break;
                case "SelectionRect.RightHandle":
                    app.appStateStore.setCursor("ew-resize");
                    break;
                case "SelectionRect.BottomLeftHandle":
                    app.appStateStore.setCursor("nesw-resize");
                    break;
                case "SelectionRect.BottomHandle":
                    app.appStateStore.setCursor("ns-resize");
                    break;
                case "SelectionRect.BottomRightHandle":
                    app.appStateStore.setCursor("nwse-resize");
                    break;
            }
        } else {
            app.appStateStore.setCursor("default");
        }
    }

    private onCanvasTap(app: App, ev: CanvasPointerEvent) {
        const hitEntity = testHitEntities(
            app.canvasStateStore.getState(),
            ev.point,
            app.viewportStore.getState().scale,
        ).entities.at(0);

        if (hitEntity !== undefined) {
            const previousSelectedEntityIds = getSelectedEntityIds(
                app.appStateStore.getState().mode,
            );

            const selectedOnlyThisEntity =
                previousSelectedEntityIds.size === 1 &&
                previousSelectedEntityIds.has(hitEntity.target.props.id);

            if (ev.shiftKey) {
                app.unselect(hitEntity.target.props.id);
            } else {
                if (!selectedOnlyThisEntity) {
                    app.unselectAll();
                    app.select(hitEntity.target.props.id);
                }
            }

            hitEntity.target.onTap(app, {
                ...ev,
                previousSelectedEntities: previousSelectedEntityIds,
            });
        } else {
            if (!ev.shiftKey) app.unselectAll();
        }
    }

    private onEntityPointerDown(
        app: App,
        ev: CanvasPointerEvent,
        entity: Entity,
    ) {
        const previousSelectedEntities = getSelectedEntityIds(
            app.appStateStore.getState().mode,
        );

        if (!ev.shiftKey) app.unselectAll();
        app.select(entity.props.id);

        setupSelectionTransformPointerEventHandlers(
            app,
            ev,
            new TranslateSelectionTransformController(app, ev.point),
        );
        app.gestureRecognizer.addPointerUpHandler(ev.pointerId, (app, ev) => {
            if (ev.isTap) {
                entity.onTap(app, { ...ev, previousSelectedEntities });
            }
        });
    }

    private onSelectionPointerDown(
        app: App,
        ev: CanvasPointerEvent,
        selectionHandle: SelectionHandleType,
    ) {
        switch (selectionHandle.type) {
            case "SelectionRect.TopLeftHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.bottomRight,
                        "left",
                        "top",
                    ),
                );
                break;
            }
            case "SelectionRect.TopHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.bottomCenter,
                        "center",
                        "top",
                    ),
                );
                break;
            }
            case "SelectionRect.TopRightHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.bottomLeft,
                        "right",
                        "top",
                    ),
                );
                break;
            }
            case "SelectionRect.LeftHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.centerRight,
                        "left",
                        "center",
                    ),
                );
                break;
            }
            case "SelectionRect.RightHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.centerLeft,
                        "right",
                        "center",
                    ),
                );
                break;
            }
            case "SelectionRect.BottomLeftHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.topRight,
                        "left",
                        "bottom",
                    ),
                );
                break;
            }
            case "SelectionRect.BottomHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.topCenter,
                        "center",
                        "bottom",
                    ),
                );
                break;
            }
            case "SelectionRect.BottomRightHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.selectionRect.topLeft,
                        "right",
                        "bottom",
                    ),
                );
                break;
            }
            case "SelectionRect.CenterHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new TranslateSelectionTransformController(app, ev.point),
                );
                break;
            }
        }

        app.gestureRecognizer.addPointerUpHandler(ev.pointerId, (app, ev) => {
            if (ev.isTap) {
                this.onCanvasTap(app, ev);
            }
        });
    }

    private getSelectionHandleType(
        app: App,
        point: Point,
        margin = 8,
    ): SelectionHandleType | null {
        const marginInCanvas = margin / app.viewportStore.getState().scale;
        const selectionRect = this.getSelectionRect(app);
        if (selectionRect === null) return null;

        const hitAreaX = testHitWithRange(
            point.x,
            selectionRect.left,
            selectionRect.right,
            marginInCanvas,
        );
        const hitAreaY = testHitWithRange(
            point.y,
            selectionRect.top,
            selectionRect.bottom,
            marginInCanvas,
        );

        switch (hitAreaX) {
            case "start": {
                switch (hitAreaY) {
                    case "start": {
                        return {
                            type: "SelectionRect.TopLeftHandle",
                            selectionRect,
                        };
                    }
                    case "middle": {
                        return {
                            type: "SelectionRect.LeftHandle",
                            selectionRect,
                        };
                    }
                    case "end": {
                        return {
                            type: "SelectionRect.BottomLeftHandle",
                            selectionRect,
                        };
                    }
                }
                break;
            }
            case "middle": {
                switch (hitAreaY) {
                    case "start": {
                        return {
                            type: "SelectionRect.TopHandle",
                            selectionRect,
                        };
                    }
                    case "middle": {
                        return {
                            type: "SelectionRect.CenterHandle",
                            selectionRect,
                        };
                    }
                    case "end": {
                        return {
                            type: "SelectionRect.BottomHandle",
                            selectionRect,
                        };
                    }
                }
                break;
            }
            case "end": {
                switch (hitAreaY) {
                    case "start": {
                        return {
                            type: "SelectionRect.TopRightHandle",
                            selectionRect,
                        };
                    }
                    case "middle": {
                        return {
                            type: "SelectionRect.RightHandle",
                            selectionRect,
                        };
                    }
                    case "end": {
                        return {
                            type: "SelectionRect.BottomRightHandle",
                            selectionRect,
                        };
                    }
                }
                break;
            }
        }

        return null;
    }

    private getSelectionRect(app: App): Rect | null {
        const selectedEntities = getSelectedEntities(
            app.appStateStore.getState().mode,
            app.canvasStateStore.getState(),
        );
        if (selectedEntities.length === 0) return null;

        return Rect.union(
            selectedEntities.map((entity) => entity.getBoundingRect()),
        );
    }
}

export interface SelectEntityMode extends Mode {
    type: "select-entity";
    entityIds: Set<string>;
}

export function isSelectEntityMode(mode: Mode): mode is SelectEntityMode {
    return mode.type === "select-entity";
}

export function createSelectEntityMode(
    entityIds: Set<string>,
): SelectEntityMode {
    return { type: "select-entity", entityIds };
}

export function getSelectedEntityIds(mode: Mode): Set<string> {
    if (!isSelectEntityMode(mode)) return new Set();
    return mode.entityIds;
}

export function getSelectedEntities(mode: Mode, page: Page): Entity[] {
    return Array.from(getSelectedEntityIds(mode)).map((id) => {
        const entity = page.entities.get(id);
        assert(entity !== undefined, `Entity ${id} not found`);
        return entity;
    });
}

export function getSelectionRect(mode: Mode, page: Page): Rect | null {
    const selectedEntities = getSelectedEntities(mode, page);
    if (selectedEntities.length === 0) return null;

    return Rect.union(
        selectedEntities.map((entity) => entity.getBoundingRect()),
    );
}

export type SelectionHandleType =
    | { type: "SelectionRect.TopLeftHandle"; selectionRect: Rect }
    | { type: "SelectionRect.TopHandle"; selectionRect: Rect }
    | { type: "SelectionRect.TopRightHandle"; selectionRect: Rect }
    | { type: "SelectionRect.LeftHandle"; selectionRect: Rect }
    | { type: "SelectionRect.CenterHandle"; selectionRect: Rect }
    | { type: "SelectionRect.RightHandle"; selectionRect: Rect }
    | { type: "SelectionRect.BottomLeftHandle"; selectionRect: Rect }
    | { type: "SelectionRect.BottomHandle"; selectionRect: Rect }
    | { type: "SelectionRect.BottomRightHandle"; selectionRect: Rect };

/**
 * Test if a given value is inside of a range.
 */
function testHitWithRange(
    value: number,
    start: number,
    end: number,
    marginInCanvas: number,
): "start" | "middle" | "end" | "none" {
    const outerStart = start - marginInCanvas;
    const innerStart =
        end - start < marginInCanvas * 4
            ? (start * 3 + end) / 4
            : start + marginInCanvas;
    const innerEnd =
        end - start < marginInCanvas * 4
            ? (start + end * 3) / 4
            : end - marginInCanvas;
    const outerEnd = end + marginInCanvas;

    if (value < outerStart) {
        return "none";
    } else if (value < innerStart) {
        return "start";
    } else if (value < innerEnd) {
        return "middle";
    } else if (value < outerEnd) {
        return "end";
    } else {
        return "none";
    }
}
