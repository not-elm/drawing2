import {
    PROPERTY_KEY_CORNER_RADIUS,
    PathEntity,
} from "../default/entity/PathEntity/PathEntity";
import { NewTextModeController } from "../default/mode/NewTextModeController";
import { normalizeAngle } from "../lib/normalizeAngle";
import { testHitEntities } from "../lib/testHitEntities";
import type { App } from "./App";
import type { Entity } from "./Entity";
import type { GraphNode } from "./Graph";
import { type CanvasPointerEvent, ModeController } from "./ModeController";
import { SelectEntityModeStateStore } from "./SelectEntityModeStateStore";
import {
    ScaleSelectionTransformController,
    TranslateSelectionTransformController,
} from "./SelectionTransformController";
import { Point } from "./geo/Point";
import type { Rect } from "./geo/Shape";
import { setupBrushSelectPointerEventHandlers } from "./setupBrushSelectPointerEventHandlers";
import { setupCornerRadiusHandlePointerEventHandlers } from "./setupCornerRadiusHandlePointerEventHandlers";
import { setupSelectionTransformPointerEventHandlers } from "./setupSelectionTransformPointerEventHandlers";

export class SelectEntityModeController extends ModeController {
    static readonly MODE_NAME = "select-entity";

    readonly store = new SelectEntityModeStateStore();

    onRegistered(app: App): void {
        app.keyboard.addBinding({
            key: "a",
            metaKey: true,
            action: (app, ev) => {
                app.setMode(SelectEntityModeController.MODE_NAME);
                app.canvasStateStore.selectAll();
            },
        });
        app.keyboard.addBinding({
            key: "a",
            ctrlKey: true,
            action: (app, ev) => {
                app.setMode(SelectEntityModeController.MODE_NAME);
                app.canvasStateStore.selectAll();
            },
        });

        app.keyboard.addBinding({
            key: "Escape",
            mode: [SelectEntityModeController.MODE_NAME],
            action: (app, ev) => {
                app.canvasStateStore.unselectAll();
            },
        });
        app.keyboard.addBinding({
            key: "Backspace",
            mode: [SelectEntityModeController.MODE_NAME],
            action: (app, ev) => {
                app.deleteSelectedEntities();
            },
        });
        app.keyboard.addBinding({
            key: "Delete",
            mode: [SelectEntityModeController.MODE_NAME],
            action: (app, ev) => {
                app.deleteSelectedEntities();
            },
        });

        app.contextMenu.add({
            title: "最前面へ",
            action: () => {
                app.bringToFront();
            },
        });
        app.contextMenu.add({
            title: "ひとつ前へ",
            action: () => {
                app.bringForward();
            },
        });
        app.contextMenu.add({
            title: "ひとつ後ろへ",
            action: () => {
                app.sendBackward();
            },
        });
        app.contextMenu.add({
            title: "最背面へ",
            action: () => {
                app.sendToBack();
            },
        });
    }

    onCanvasPointerDown(app: App, ev: CanvasPointerEvent): void {
        const handle = this.getHandleType(app, ev.point);
        if (handle !== null) {
            this.onSelectionPointerDown(app, ev, handle);
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

        setupBrushSelectPointerEventHandlers(app, ev, this.store);
    }

    onCanvasDoubleClick(app: App, ev: CanvasPointerEvent) {
        app.setMode(NewTextModeController.MODE_NAME);
        app.getModeController().onCanvasPointerDown(app, ev);
    }

    onMouseMove(app: App, point: Point) {
        this.updateCursor(app, point);
        this.updateVisibleCornerRoundHandles(app, point);
    }

    onContextMenu(app: App, ev: CanvasPointerEvent) {
        const hitResult = testHitEntities(
            app.canvasStateStore.getState().page,
            ev.point,
            app.viewportStore.getState().scale,
        );
        const result = hitResult.entities.at(0);
        if (result !== undefined) {
            const entityId = result.target.props.id;
            if (
                !app.canvasStateStore.getState().selectedEntityIds.has(entityId)
            ) {
                app.canvasStateStore.unselectAll();
                app.canvasStateStore.select(result.target.props.id);
            }
        }

        super.onContextMenu(app, ev);
    }

    private updateVisibleCornerRoundHandles(app: App, point: Point) {
        const selectedEntities = app.canvasStateStore
            .getState()
            .getSelectedEntities();
        if (
            selectedEntities.length !== 1 ||
            !(selectedEntities[0] instanceof PathEntity)
        ) {
            this.store.setVisibleCornerRoundHandles([]);
            return;
        }
        const entity = selectedEntities[0];

        const handles = getCornerRoundHandleData(
            entity.graph.getShape().points,
            entity.getProperty(PROPERTY_KEY_CORNER_RADIUS, 0),
        );

        const visibleHandles: CornerRoundHandleData[] = [];
        for (const handle of handles) {
            if (
                isPointInTriangle(point, [
                    handle.previousNode,
                    handle.node,
                    handle.nextNode,
                ])
            ) {
                visibleHandles.push(handle);
            }
        }

        this.store.setVisibleCornerRoundHandles(visibleHandles);
    }

    private updateCursor(app: App, point: Point) {
        const handle = this.getHandleType(app, point);
        if (handle !== null) {
            switch (handle.type) {
                case "TopLeftHandle":
                    app.appStateStore.setCursor("nwse-resize");
                    break;
                case "TopHandle":
                    app.appStateStore.setCursor("ns-resize");
                    break;
                case "TopRightHandle":
                    app.appStateStore.setCursor("nesw-resize");
                    break;
                case "LeftHandle":
                    app.appStateStore.setCursor("ew-resize");
                    break;
                case "CenterHandle":
                    app.appStateStore.setCursor("default");
                    break;
                case "RightHandle":
                    app.appStateStore.setCursor("ew-resize");
                    break;
                case "BottomLeftHandle":
                    app.appStateStore.setCursor("nesw-resize");
                    break;
                case "BottomHandle":
                    app.appStateStore.setCursor("ns-resize");
                    break;
                case "BottomRightHandle":
                    app.appStateStore.setCursor("nwse-resize");
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
            const previousSelectedEntityIds =
                app.canvasStateStore.getState().selectedEntityIds;

            const selectedOnlyThisEntity =
                previousSelectedEntityIds.size === 1 &&
                previousSelectedEntityIds.has(hitEntity.target.props.id);

            if (ev.shiftKey) {
                app.canvasStateStore.unselect(hitEntity.target.props.id);
            } else {
                if (!selectedOnlyThisEntity) {
                    app.canvasStateStore.unselectAll();
                    app.canvasStateStore.select(hitEntity.target.props.id);
                }
            }

            hitEntity.target.onTap(app, {
                ...ev,
                previousSelectedEntities: previousSelectedEntityIds,
            });
        } else {
            if (!ev.shiftKey) app.canvasStateStore.unselectAll();
        }
    }

    private onEntityPointerDown(
        app: App,
        ev: CanvasPointerEvent,
        entity: Entity,
    ) {
        const previousSelectedEntities =
            app.canvasStateStore.getState().selectedEntityIds;

        if (!ev.shiftKey) app.canvasStateStore.unselectAll();
        app.canvasStateStore.select(entity.props.id);

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
        handle: HandleType,
    ) {
        switch (handle.type) {
            case "TopLeftHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.bottomRight,
                        "left",
                        "top",
                    ),
                );
                break;
            }
            case "TopHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.bottomCenter,
                        "center",
                        "top",
                    ),
                );
                break;
            }
            case "TopRightHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.bottomLeft,
                        "right",
                        "top",
                    ),
                );
                break;
            }
            case "LeftHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.centerRight,
                        "left",
                        "center",
                    ),
                );
                break;
            }
            case "RightHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.centerLeft,
                        "right",
                        "center",
                    ),
                );
                break;
            }
            case "BottomLeftHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.topRight,
                        "left",
                        "bottom",
                    ),
                );
                break;
            }
            case "BottomHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.topCenter,
                        "center",
                        "bottom",
                    ),
                );
                break;
            }
            case "BottomRightHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new ScaleSelectionTransformController(
                        app,
                        ev.point,
                        handle.selectionRect.topLeft,
                        "right",
                        "bottom",
                    ),
                );
                break;
            }
            case "CenterHandle": {
                setupSelectionTransformPointerEventHandlers(
                    app,
                    ev,
                    new TranslateSelectionTransformController(app, ev.point),
                );
                break;
            }
            case "CornerRadiusHandle": {
                setupCornerRadiusHandlePointerEventHandlers(
                    app,
                    ev,
                    handle.entity,
                    handle.handle,
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

    private getHandleType(
        app: App,
        point: Point,
        margin = 8,
    ): HandleType | null {
        const marginInCanvas = margin / app.viewportStore.getState().scale;
        const selectedEntities = app.canvasStateStore
            .getState()
            .getSelectedEntities();
        if (
            selectedEntities.length === 1 &&
            selectedEntities[0] instanceof PathEntity
        ) {
            const entity = selectedEntities[0];

            const handles = getCornerRoundHandleData(
                entity.graph.getShape().points,
                entity.getProperty(PROPERTY_KEY_CORNER_RADIUS, 0),
            );

            for (const handle of handles) {
                const distance = Math.hypot(
                    handle.handlePosition.x - point.x,
                    handle.handlePosition.y - point.y,
                );

                if (distance < marginInCanvas) {
                    return {
                        type: "CornerRadiusHandle",
                        entity,
                        handle,
                    };
                }
            }
        }

        const selectionRect = app.canvasStateStore
            .getState()
            .getSelectionRect();
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
                            type: "TopLeftHandle",
                            selectionRect,
                        };
                    }
                    case "middle": {
                        return {
                            type: "LeftHandle",
                            selectionRect,
                        };
                    }
                    case "end": {
                        return {
                            type: "BottomLeftHandle",
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
                            type: "TopHandle",
                            selectionRect,
                        };
                    }
                    case "middle": {
                        return {
                            type: "CenterHandle",
                            selectionRect,
                        };
                    }
                    case "end": {
                        return {
                            type: "BottomHandle",
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
                            type: "TopRightHandle",
                            selectionRect,
                        };
                    }
                    case "middle": {
                        return {
                            type: "RightHandle",
                            selectionRect,
                        };
                    }
                    case "end": {
                        return {
                            type: "BottomRightHandle",
                            selectionRect,
                        };
                    }
                }
                break;
            }
        }

        return null;
    }
}

export interface CornerRoundHandleData {
    node: GraphNode;
    previousNode: GraphNode;
    nextNode: GraphNode;
    arcStartPosition: Point;
    arcEndPosition: Point;
    handlePosition: Point;

    /**
     * The angle of the corner in radian
     */
    cornerAngle: number;

    /**
     * The angle of the corner arc in radian
     */
    arcAngle: number;

    /**
     * Length from the corner to the point on the edge that the circle touches on
     */
    offset: number;
}

export function getMaxCornerRadius(outline: Array<Point>): number {
    // 1/tan(angle / 2) of each angle of the outline
    const invTans: number[] = [];

    // i-th element is the length between P_i and P_i+1
    const edgeLength: number[] = [];

    for (let i = 0; i < outline.length; i++) {
        const p0 = outline[(i - 1 + outline.length) % outline.length];
        const p1 = outline[i];
        const p2 = outline[(i + 1) % outline.length];

        const p10x = p0.x - p1.x;
        const p10y = p0.y - p1.y;

        const p12x = p2.x - p1.x;
        const p12y = p2.y - p1.y;
        const norm12 = Math.hypot(p12x, p12y);

        const angleP10 = Math.atan2(p10y, p10x);
        const angleP12 = Math.atan2(p12y, p12x);
        const angle = normalizeAngle(-(angleP12 - angleP10));
        const invTan =
            1 / Math.tan(angle > Math.PI ? Math.PI - angle / 2 : angle / 2);

        invTans.push(invTan);
        edgeLength.push(norm12);
    }

    let minCornerRadius = Number.POSITIVE_INFINITY;
    for (let i = 0; i < outline.length; i++) {
        const sumInvTan = invTans[i] + invTans[(i + 1) % outline.length];
        minCornerRadius = Math.min(minCornerRadius, edgeLength[i] / sumInvTan);
    }

    return minCornerRadius;
}

export function getCornerRoundHandleData(
    outline: GraphNode[],
    cornerRadius: number,
): CornerRoundHandleData[] {
    const CORNER_RADIUS_HANDLE_MARGIN = 50;

    const handles: CornerRoundHandleData[] = [];

    for (let i = 0; i < outline.length; i++) {
        const p0 = outline[(i - 1 + outline.length) % outline.length];
        const p1 = outline[i];
        const p2 = outline[(i + 1) % outline.length];

        const p10x = p0.x - p1.x;
        const p10y = p0.y - p1.y;
        const norm10 = Math.hypot(p10x, p10y);
        const i10x = p10x / norm10;
        const i10y = p10y / norm10;

        const p12x = p2.x - p1.x;
        const p12y = p2.y - p1.y;
        const norm12 = Math.hypot(p12x, p12y);
        const i12x = p12x / norm12;
        const i12y = p12y / norm12;

        const angleP10 = Math.atan2(p10y, p10x);
        const angleP12 = Math.atan2(p12y, p12x);
        const angle = normalizeAngle(-(angleP12 - angleP10));
        const offset =
            cornerRadius /
            Math.tan(angle > Math.PI ? Math.PI - angle / 2 : angle / 2);

        const normHandle = Math.max(
            Math.hypot(offset, cornerRadius),
            CORNER_RADIUS_HANDLE_MARGIN,
        );

        const iHandleX = (i10x + i12x) / Math.hypot(i10x + i12x, i10y + i12y);
        const iHandleY = (i10y + i12y) / Math.hypot(i10x + i12x, i10y + i12y);
        const handleX = p1.x + iHandleX * normHandle;
        const handleY = p1.y + iHandleY * normHandle;

        handles.push({
            node: p1,
            previousNode: p0,
            nextNode: p2,
            arcStartPosition: new Point(
                p1.x + offset * i10x,
                p1.y + offset * i10y,
            ),
            arcEndPosition: new Point(
                p1.x + offset * i12x,
                p1.y + offset * i12y,
            ),
            handlePosition: new Point(handleX, handleY),
            cornerAngle: angle,
            arcAngle: angle > Math.PI ? 2 * Math.PI - angle : angle,
            offset,
        });
    }

    return handles;
}

export type HandleType =
    | { type: "TopLeftHandle"; selectionRect: Rect }
    | { type: "TopHandle"; selectionRect: Rect }
    | { type: "TopRightHandle"; selectionRect: Rect }
    | { type: "LeftHandle"; selectionRect: Rect }
    | { type: "CenterHandle"; selectionRect: Rect }
    | { type: "RightHandle"; selectionRect: Rect }
    | { type: "BottomLeftHandle"; selectionRect: Rect }
    | { type: "BottomHandle"; selectionRect: Rect }
    | { type: "BottomRightHandle"; selectionRect: Rect }
    | {
          type: "CornerRadiusHandle";
          entity: PathEntity;
          handle: CornerRoundHandleData;
      };

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

function isPointInTriangle(
    point: Point,
    triangle: [Point, Point, Point],
): boolean {
    const [p0, p1, p2] = triangle;

    const p0x = p0.x - point.x;
    const p0y = p0.y - point.y;
    const p1x = p1.x - point.x;
    const p1y = p1.y - point.y;
    const p2x = p2.x - point.x;
    const p2y = p2.y - point.y;

    const cross01 = p0x * p1y - p0y * p1x;
    const cross12 = p1x * p2y - p1y * p2x;
    const cross20 = p2x * p0y - p2y * p0x;

    if (cross01 * cross12 < 0) return false;
    if (cross12 * cross20 < 0) return false;
    if (cross20 * cross01 < 0) return false;

    return true;
}
