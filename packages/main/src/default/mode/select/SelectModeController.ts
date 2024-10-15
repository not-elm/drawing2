import type { App } from "../../../core/App";
import type { AppStateStore } from "../../../core/AppStateStore";
import type { CanvasStateStore } from "../../../core/CanvasStateStore";
import { Direction } from "../../../core/Direction";
import type { Entity } from "../../../core/Entity";
import type { GestureRecognizer } from "../../../core/GestureRecognizer";
import type { HistoryManager } from "../../../core/HistoryManager";
import {
    ModeController,
    type PointerDownEvent,
} from "../../../core/ModeController";
import type { PathNode } from "../../../core/Path";
import {
    type PointerEventHandlers,
    mergeHandlers,
} from "../../../core/PointerEventSession";
import {
    createMoveTransformHandle,
    createScaleTransformHandle,
} from "../../../core/TransformHandle";
import type { ViewportStore } from "../../../core/ViewportStore";
import { createBrushSelectSession } from "../../../core/createBrushSelectSession";
import { createMovePointSession } from "../../../core/createMovePointSession";
import { createTransformSession } from "../../../core/createTransformSession";
import { assert } from "../../../lib/assert";
import type { Point } from "../../../lib/geo/Point";
import type { Rect } from "../../../lib/geo/Rect";
import { testHitEntities } from "../../../lib/testHitEntities";
import { PathEntity } from "../../entity/PathEntity/PathEntity";
import { TextEntity } from "../../entity/TextEntity/TextEntity";
import { PROPERTY_KEY_SIZING_MODE } from "../../property/SizingMode";
import { EditTextModeController } from "../EditTextModeController";
import type { NewTextModeController } from "../NewTextModeController";
import { BrushStore } from "./BrushStore";
import type { SnapGuideStore } from "./SnapGuideStore";

export class SelectModeController extends ModeController {
    readonly brushStore = new BrushStore();

    constructor(
        private readonly canvasStateStore: CanvasStateStore,
        private readonly gestureRecognizer: GestureRecognizer,
        private readonly historyManager: HistoryManager,
        private readonly viewportStore: ViewportStore,
        private readonly snapGuideStore: SnapGuideStore,
        private readonly appStateStore: AppStateStore,
        private readonly app: App,
        private readonly newTextModeController: NewTextModeController,
    ) {
        super();
    }

    getType() {
        return "select";
    }

    onEntityPointerDown(data: PointerDownEvent, entity: Entity) {
        const selectionHandle = this.getSelectionHandleType(data.point);
        if (selectionHandle !== null) {
            this.handleSelectionPointerDown(data, selectionHandle);
            return;
        }

        if (!data.shiftKey) {
            this.canvasStateStore.unselectAll();
        }

        this.canvasStateStore.select(entity.props.id);

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

    onCanvasPointerDown(data: PointerDownEvent): void {
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

    onCanvasDoubleClick(ev: PointerDownEvent) {
        this.newTextModeController.onCanvasPointerDown(ev);
    }

    private handleSelectionPointerDown(
        data: PointerDownEvent,
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
                    this.app,
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
                this.canvasStateStore.edit((tx) => {
                    tx.updateProperty(
                        this.canvasStateStore.getState().selectedEntityIds,
                        PROPERTY_KEY_SIZING_MODE,
                        "fixed",
                    );
                });
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
                this.canvasStateStore.edit((tx) => {
                    tx.updateProperty(
                        this.canvasStateStore.getState().selectedEntityIds,
                        PROPERTY_KEY_SIZING_MODE,
                        "fixed",
                    );
                });
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
                            this.canvasStateStore.unselect(
                                object.target.props.id,
                            );
                        }
                    } else {
                        if (object !== undefined) {
                            const selectedEntityIds =
                                this.canvasStateStore.getState()
                                    .selectedEntityIds;
                            if (
                                selectedEntityIds.length === 1 &&
                                selectedEntityIds[0] === object.target.props.id
                            ) {
                                this.app.setMode(
                                    EditTextModeController.createMode(
                                        object.target.props.id,
                                    ),
                                );
                            } else {
                                this.canvasStateStore.unselectAll();
                                this.canvasStateStore.select(
                                    object.target.props.id,
                                );
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
            const entity = this.canvasStateStore
                .getState()
                .getSelectedEntities()[0];
            assert(entity instanceof PathEntity, "Selected entity is not path");
            const pathEntity = entity as PathEntity;

            for (const node of Object.values(pathEntity.props.nodes)) {
                if (point.getDistance(node.point).distance < marginInCanvas) {
                    return {
                        type: "SelectionPath.Node",
                        path: pathEntity,
                        node,
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
            const entity = this.canvasStateStore
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
