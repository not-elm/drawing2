import type { Point } from "../../geo/Point";
import type { Rect } from "../../geo/Rect";
import { assert } from "../../lib/assert";
import { testHitEntities } from "../../lib/testHitEntities";
import { Direction } from "../../model/Direction";
import type { Entity } from "../../model/Entity";
import {
    type PathEntity,
    type PathNode,
    getEdgesFromPath,
} from "../../model/PathEntity";
import type { TextEntity } from "../../model/TextEntity";
import {
    createMoveTransformHandle,
    createScaleTransformHandle,
} from "../../model/TransformHandle";
import type { AppStateStore } from "../../store/AppStateStore";
import type { BrushStore } from "../../store/BrushStore";
import type { CanvasStateStore } from "../../store/CanvasStateStore";
import type { SnapGuideStore } from "../../store/SnapGuideStore";
import type { ViewportStore } from "../../store/ViewportStore";
import type {
    AppController,
    PointerDownEventHandlerData,
} from "../AppController";
import type { GestureRecognizer } from "../GestureRecognizer";
import type { HistoryManager } from "../HistoryManager";
import {
    type PointerEventHandlers,
    mergeHandlers,
} from "../PointerEventSession/PointerEventSession";
import { createBrushSelectSession } from "../PointerEventSession/createBrushSelectSession";
import { createMovePointSession } from "../PointerEventSession/createMovePointSession";
import { createTransformSession } from "../PointerEventSession/createTransformSession";
import { ModeController } from "./ModeController";
import type { NewTextModeController } from "./NewTextModeController";

export class SelectModeController extends ModeController {
    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly brushStore: BrushStore,
        private readonly gestureRecognizer: GestureRecognizer,
        private readonly historyManager: HistoryManager,
        private readonly viewportStore: ViewportStore,
        private readonly snapGuideStore: SnapGuideStore,
        private readonly appStateStore: AppStateStore,
        private readonly controller: AppController,
        private readonly newTextModeController: NewTextModeController,
    ) {
        super();
    }

    getType() {
        return "select";
    }

    onEntityPointerDown(data: PointerDownEventHandlerData, entity: Entity) {
        const selectionHandle = this.getSelectionHandleType(data.point);
        if (selectionHandle !== null) {
            this.handleSelectionPointerDown(data, selectionHandle);
            return;
        }

        if (!data.shiftKey) {
            this.canvasStateStore.unselectAll();
        }

        this.canvasStateStore.select(entity.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createTransformSession(
                this.historyManager,
                createMoveTransformHandle(
                    this.canvasStateStore,
                    this.viewportStore,
                    this.snapGuideStore,
                    data.point,
                ),
            ),
        );
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const selectionHandle = this.getSelectionHandleType(data.point);
        if (selectionHandle !== null) {
            this.handleSelectionPointerDown(data, selectionHandle);
            return;
        }

        if (!data.shiftKey) {
            this.canvasStateStore.unselectAll();
        }

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createBrushSelectSession(this.canvasStateStore, this.brushStore),
        );
    }

    onMouseMove(point: Point) {
        const selectionHandle = this.getSelectionHandleType(point);
        if (selectionHandle !== null) {
            switch (selectionHandle.type) {
                case "SelectionRect.TopLeftHandle":
                    this.appStateStore.setCursor("nwse-resize");
                    break;
                case "SelectionRect.TopHandle":
                    this.appStateStore.setCursor("ns-resize");
                    break;
                case "SelectionRect.TopRightHandle":
                    this.appStateStore.setCursor("nesw-resize");
                    break;
                case "SelectionRect.LeftHandle":
                    this.appStateStore.setCursor("ew-resize");
                    break;
                case "SelectionRect.CenterHandle":
                    this.appStateStore.setCursor("default");
                    break;
                case "SelectionRect.RightHandle":
                    this.appStateStore.setCursor("ew-resize");
                    break;
                case "SelectionRect.BottomLeftHandle":
                    this.appStateStore.setCursor("nesw-resize");
                    break;
                case "SelectionRect.BottomHandle":
                    this.appStateStore.setCursor("ns-resize");
                    break;
                case "SelectionRect.BottomRightHandle":
                    this.appStateStore.setCursor("nwse-resize");
                    break;
                case "SelectionPath.Node":
                    this.appStateStore.setCursor("grab");
                    break;
                case "SelectionPath.Edge":
                    this.appStateStore.setCursor("default");
                    break;
                case "SelectionText.Left":
                    this.appStateStore.setCursor("ew-resize");
                    break;
                case "SelectionText.Center":
                    this.appStateStore.setCursor("default");
                    break;
                case "SelectionText.Right":
                    this.appStateStore.setCursor("ew-resize");
                    break;
            }
        } else {
            this.appStateStore.setCursor("default");
        }
    }

    onCanvasDoubleClick(ev: PointerDownEventHandlerData) {
        this.newTextModeController.onCanvasPointerDown(ev);
    }

    private handleSelectionPointerDown(
        data: PointerDownEventHandlerData,
        selectionHandle: SelectionHandleType,
    ) {
        const { pointerId, point } = data;

        let session: PointerEventHandlers;
        switch (selectionHandle.type) {
            case "SelectionRect.TopLeftHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.topLeft,
                    ),
                );
                break;
            }
            case "SelectionRect.TopHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.top,
                    ),
                );
                break;
            }
            case "SelectionRect.TopRightHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.topRight,
                    ),
                );
                break;
            }
            case "SelectionRect.LeftHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.left,
                    ),
                );
                break;
            }
            case "SelectionRect.RightHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.right,
                    ),
                );
                break;
            }
            case "SelectionRect.BottomLeftHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.bottomLeft,
                    ),
                );
                break;
            }
            case "SelectionRect.BottomHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.bottom,
                    ),
                );
                break;
            }
            case "SelectionRect.BottomRightHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.bottomRight,
                    ),
                );
                break;
            }
            case "SelectionRect.CenterHandle": {
                session = createTransformSession(
                    this.historyManager,
                    createMoveTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        point,
                    ),
                );
                break;
            }
            case "SelectionPath.Node": {
                session = createMovePointSession(
                    selectionHandle.path,
                    selectionHandle.node.id,
                    this.canvasStateStore,
                    this.historyManager,
                );
                break;
            }
            case "SelectionPath.Edge": {
                session = createTransformSession(
                    this.historyManager,
                    createMoveTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        point,
                    ),
                );
                break;
            }
            case "SelectionText.Left": {
                this.canvasStateStore.setTextEntitySizingMode("fixed");
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.left,
                    ),
                );
                break;
            }
            case "SelectionText.Center": {
                session = createTransformSession(
                    this.historyManager,
                    createMoveTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        point,
                    ),
                );
                break;
            }
            case "SelectionText.Right": {
                this.canvasStateStore.setTextEntitySizingMode("fixed");
                session = createTransformSession(
                    this.historyManager,
                    createScaleTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        Direction.right,
                    ),
                );
                break;
            }
        }

        this.gestureRecognizer.addSessionHandlers(
            pointerId,
            mergeHandlers(session, {
                onPointerUp: (data) => {
                    if (!data.isShortClick) return;

                    const object = testHitEntities(
                        this.canvasStateStore.getState().page,
                        data.new,
                        this.viewportStore.getState().scale,
                    ).entities.at(0);

                    if (data.shiftKey) {
                        if (object !== undefined) {
                            this.canvasStateStore.unselect(object.target.id);
                        }
                    } else {
                        if (object !== undefined) {
                            const selectedEntityIds =
                                this.canvasStateStore.getState()
                                    .selectedEntityIds;
                            if (
                                selectedEntityIds.length === 1 &&
                                selectedEntityIds[0] === object.target.id
                            ) {
                                this.controller.startTextEditing(
                                    object.target.id,
                                );
                            } else {
                                this.canvasStateStore.unselectAll();
                                this.canvasStateStore.select(object.target.id);
                            }
                        } else {
                            this.canvasStateStore.unselectAll();
                        }
                    }
                },
            }),
        );
    }

    private getSelectionHandleType(
        point: Point,
        margin = 8,
    ): SelectionHandleType | null {
        const marginInCanvas = margin / this.viewportStore.getState().scale;

        const selectionType = this.getSelectionType();

        if (selectionType === "path") {
            const path = this.canvasStateStore
                .getState()
                .getSelectedEntities()[0];
            assert(path.type === "path", "Selected entity is not path");

            for (const node of Object.values(path.nodes)) {
                if (point.getDistanceFrom(node.point) < marginInCanvas) {
                    return { type: "SelectionPath.Node", path, node };
                }
            }

            for (const edge of getEdgesFromPath(path)) {
                if (edge.getDistanceFrom(point).distance < marginInCanvas) {
                    {
                        return { type: "SelectionPath.Edge", path: path };
                    }
                }
            }
        }

        if (selectionType === "text") {
            const text = this.canvasStateStore
                .getState()
                .getSelectedEntities()[0];
            assert(text.type === "text", "Selected entity is not text");

            const hitAreaX = testHitWithRange(
                point.x,
                text.rect.left,
                text.rect.right,
                marginInCanvas,
            );
            if (
                text.rect.top - marginInCanvas < point.y &&
                point.y < text.rect.bottom + marginInCanvas
            ) {
                switch (hitAreaX) {
                    case "start": {
                        return { type: "SelectionText.Left", text };
                    }
                    case "middle": {
                        return { type: "SelectionText.Center", text };
                    }
                    case "end": {
                        return { type: "SelectionText.Right", text };
                    }
                }
            }
        }

        if (selectionType === "rect") {
            const selectionRect = this.canvasStateStore
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

    private getSelectionType(): SelectionType {
        const selectedEntities = this.canvasStateStore
            .getState()
            .getSelectedEntities();

        if (selectedEntities.length === 0) return "none";

        if (
            selectedEntities.length === 1 &&
            selectedEntities[0].type === "path"
        ) {
            return "path";
        }

        if (
            selectedEntities.length === 1 &&
            selectedEntities[0].type === "text"
        ) {
            return "text";
        }

        return "rect";
    }
}

type SelectionType = "path" | "rect" | "text" | "none";

type SelectionHandleType =
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
 *
 *
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
