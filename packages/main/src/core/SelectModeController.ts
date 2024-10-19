import { PathEntity } from "../default/entity/PathEntity/PathEntity";
import { TextEntity } from "../default/entity/TextEntity/TextEntity";
import { assert } from "../lib/assert";
import { Point } from "../lib/geo/Point";
import type { Rect } from "../lib/geo/Rect";
import { testHitEntities } from "../lib/testHitEntities";
import type { App } from "./App";
import { BrushStore } from "./BrushStore";
import type { Entity } from "./Entity";
import { type CanvasPointerEvent, ModeController } from "./ModeController";
import type { PathNode } from "./Path";
import {
    ScaleSelectionTransformController,
    TranslateSelectionTransformController,
} from "./SelectionTransformController";
import { setupBrushSelectPointerEventHandlers } from "./setupBrushSelectPointerEventHandlers";
import { setupMovePointPointerEventHandlers } from "./setupMovePointPointerEventHandlers";
import { setupSelectionTransformPointerEventHandlers } from "./setupSelectionTransformPointerEventHandlers";

export class SelectModeController extends ModeController {
    readonly brushStore = new BrushStore();

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const selectionHandle = this.getSelectionHandleType(app, ev.point);
        if (selectionHandle !== null) {
            this.onSelectionPointerDown(app, ev, selectionHandle);
            return;
        }

        const hitResult = testHitEntities(
            app.canvasStateStore.getState().page,
            ev.point,
            app.viewportStore.getState().scale,
        );
        const result = hitResult.entities.at(0);
        if (result !== undefined) {
            this.onEntityPointerDown(app, ev, result.target);
            return;
        }

        if (!ev.shiftKey) app.canvasStateStore.unselectAll();

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
                case "SelectionPath.Node":
                    app.appStateStore.setCursor("grab");
                    break;
                case "SelectionPath.Edge":
                    app.appStateStore.setCursor("default");
                    break;
                case "SelectionText.Left":
                    app.appStateStore.setCursor("ew-resize");
                    break;
                case "SelectionText.Center":
                    app.appStateStore.setCursor("default");
                    break;
                case "SelectionText.Right":
                    app.appStateStore.setCursor("ew-resize");
                    break;
            }
        } else {
            app.appStateStore.setCursor("default");
        }
    }

    private onCanvasTap(app: App, ev: CanvasPointerEvent) {
        const hitEntity = testHitEntities(
            app.canvasStateStore.getState().page,
            ev.point,
            app.viewportStore.getState().scale,
        ).entities.at(0);

        if (hitEntity !== undefined) {
            const selectedOnlyThisEntity = app.canvasStateStore
                .getState()
                .isSelectedOnly(hitEntity.target.props.id);

            if (ev.shiftKey) {
                app.canvasStateStore.unselect(hitEntity.target.props.id);
            } else {
                if (!selectedOnlyThisEntity) {
                    app.canvasStateStore.unselectAll();
                    app.canvasStateStore.select(hitEntity.target.props.id);
                }
            }

            hitEntity.target.onTap(app, { ...ev, selectedOnlyThisEntity });
        } else {
            if (!ev.shiftKey) app.canvasStateStore.unselectAll();
        }
    }

    private onEntityPointerDown(
        app: App,
        ev: CanvasPointerEvent,
        entity: Entity,
    ) {
        const selectedOnlyThisEntity = app.canvasStateStore
            .getState()
            .isSelectedOnly(entity.props.id);

        if (!ev.shiftKey) app.canvasStateStore.unselectAll();
        app.canvasStateStore.select(entity.props.id);

        setupSelectionTransformPointerEventHandlers(
            app,
            ev,
            new TranslateSelectionTransformController(app, ev.point),
        );
        app.gestureRecognizer.addPointerUpHandler(ev.pointerId, (app, ev) => {
            if (ev.isTap) {
                entity.onTap(app, { ...ev, selectedOnlyThisEntity });
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
            case "SelectionPath.Node": {
                setupMovePointPointerEventHandlers(
                    app,
                    ev,
                    selectionHandle.path,
                    selectionHandle.node.id,
                );
                break;
            }
            case "SelectionPath.Edge": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new TranslateSelectionTransformController(app, ev.point),
                );
                break;
            }
            case "SelectionText.Left": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.text.getBoundingRect().centerRight,
                        "left",
                        "center",
                    ),
                );
                break;
            }
            case "SelectionText.Center": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new TranslateSelectionTransformController(app, ev.point),
                );
                break;
            }
            case "SelectionText.Right": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        selectionHandle.text.getBoundingRect().centerLeft,
                        "right",
                        "center",
                    ),
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

        const selectionType = this.getSelectionType(app);

        if (selectionType === "path") {
            const entity = app.canvasStateStore
                .getState()
                .getSelectedEntities()[0];
            assert(entity instanceof PathEntity, "Selected entity is not path");
            const pathEntity = entity as PathEntity;

            for (const node of pathEntity.graph.nodes.values()) {
                if (
                    point.getDistance(new Point(node.x, node.y)).distance <
                    marginInCanvas
                ) {
                    return {
                        type: "SelectionPath.Node",
                        path: pathEntity,
                        node: {
                            id: node.id,
                            point: new Point(node.x, node.y),
                        },
                    };
                }
            }

            for (const edge of pathEntity.getOutline()) {
                if (edge.getDistance(point).distance < marginInCanvas) {
                    {
                        return { type: "SelectionPath.Edge", path: pathEntity };
                    }
                }
            }
        }

        if (selectionType === "text") {
            const entity = app.canvasStateStore
                .getState()
                .getSelectedEntities()[0];
            assert(entity instanceof TextEntity, "Selected entity is not text");
            const textEntity = entity as TextEntity;

            const hitAreaX = testHitWithRange(
                point.x,
                textEntity.props.rect.left,
                textEntity.props.rect.right,
                marginInCanvas,
            );
            if (
                textEntity.props.rect.top - marginInCanvas < point.y &&
                point.y < textEntity.props.rect.bottom + marginInCanvas
            ) {
                switch (hitAreaX) {
                    case "start": {
                        return { type: "SelectionText.Left", text: textEntity };
                    }
                    case "middle": {
                        return {
                            type: "SelectionText.Center",
                            text: textEntity,
                        };
                    }
                    case "end": {
                        return {
                            type: "SelectionText.Right",
                            text: textEntity,
                        };
                    }
                }
            }
        }

        if (selectionType === "rect") {
            const selectionRect = app.canvasStateStore
                .getState()
                .getSelectionRect();
            assert(selectionRect !== null, "SelectionRect must not be null");
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
        }

        return null;
    }

    private getSelectionType(app: App): SelectionType {
        const selectedEntities = app.canvasStateStore
            .getState()
            .getSelectedEntities();

        if (selectedEntities.length === 0) return "none";

        if (
            selectedEntities.length === 1 &&
            selectedEntities[0] instanceof PathEntity
        ) {
            return "path";
        }

        if (
            selectedEntities.length === 1 &&
            selectedEntities[0] instanceof TextEntity
        ) {
            return "text";
        }

        return "rect";
    }
}

type SelectionType = "path" | "rect" | "text" | "none";

export type SelectionHandleType =
    | { type: "SelectionRect.TopLeftHandle"; selectionRect: Rect }
    | { type: "SelectionRect.TopHandle"; selectionRect: Rect }
    | { type: "SelectionRect.TopRightHandle"; selectionRect: Rect }
    | { type: "SelectionRect.LeftHandle"; selectionRect: Rect }
    | { type: "SelectionRect.CenterHandle"; selectionRect: Rect }
    | { type: "SelectionRect.RightHandle"; selectionRect: Rect }
    | { type: "SelectionRect.BottomLeftHandle"; selectionRect: Rect }
    | { type: "SelectionRect.BottomHandle"; selectionRect: Rect }
    | { type: "SelectionRect.BottomRightHandle"; selectionRect: Rect }
    | { type: "SelectionPath.Edge"; path: PathEntity }
    | { type: "SelectionPath.Node"; path: PathEntity; node: PathNode }
    | { type: "SelectionText.Left"; text: TextEntity }
    | { type: "SelectionText.Center"; text: TextEntity }
    | { type: "SelectionText.Right"; text: TextEntity };

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
