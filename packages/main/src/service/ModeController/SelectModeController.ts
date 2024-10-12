import { distanceFromPointToLine } from "../../geo/Line";
import { distanceFromPointToPoint } from "../../geo/Point";
import type { Rect } from "../../geo/Rect";
import { assert } from "../../lib/assert";
import { testHitEntities } from "../../lib/testHitEntities";
import { Direction } from "../../model/Direction";
import type { Block, LineBlock, TextBlock } from "../../model/Page";
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

    onBlockPointerDown(data: PointerDownEventHandlerData, block: Block) {
        const selectionHandle = this.getSelectionHandleType(data.x, data.y);
        if (selectionHandle !== null) {
            this.handleSelectionPointerDown(data, selectionHandle);
            return;
        }

        if (!data.shiftKey) {
            this.canvasStateStore.unselectAll();
        }

        this.canvasStateStore.select(block.id);

        this.gestureRecognizer.addSessionHandlers(
            data.pointerId,
            createTransformSession(
                this.historyManager,
                createMoveTransformHandle(
                    this.canvasStateStore,
                    this.viewportStore,
                    this.snapGuideStore,
                    { x: data.x, y: data.y },
                ),
            ),
        );
    }

    onCanvasPointerDown(data: PointerDownEventHandlerData): void {
        const selectionHandle = this.getSelectionHandleType(data.x, data.y);
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

    onMouseMove(x: number, y: number) {
        const selectionHandle = this.getSelectionHandleType(x, y);
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
                case "SelectionLine.P1":
                    this.appStateStore.setCursor("grab");
                    break;
                case "SelectionLine.Center":
                    this.appStateStore.setCursor("default");
                    break;
                case "SelectionLine.P2":
                    this.appStateStore.setCursor("grab");
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
        const { pointerId, x, y } = data;

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
                        { x, y },
                    ),
                );
                break;
            }
            case "SelectionLine.P1": {
                throw new Error("Not implemented yet");
                // TODO
                // const pId = this.canvasStateStore
                //     .getState()
                //     .page.dependencies.getByToEntityId(selectionHandle.line.id)
                //     .filter((d) => d.type === "blockToPoint")
                //     .filter((d) => d.pointKey === PointKey.LINE_P1)[0];
                // assert(pId !== undefined, "Point not found");
                //
                // const point =
                //     this.canvasStateStore.getState().page.points[pId.from];
                // assert(point !== undefined, "Point not found");
                //
                // session = createMovePointSession(
                //     point,
                //     this.canvasStateStore,
                //     this.viewportStore,
                //     this.historyManager,
                // );
            }
            case "SelectionLine.P2": {
                throw new Error("Not implemented yet");
                // TODO
                // const pId = this.canvasStateStore
                //     .getState()
                //     .page.dependencies.getByToEntityId(selectionHandle.line.id)
                //     .filter((d) => d.type === "blockToPoint")
                //     .filter((d) => d.pointKey === PointKey.LINE_P2)[0];
                // assert(pId !== undefined, "Point not found");
                //
                // const point =
                //     this.canvasStateStore.getState().page.points[pId.from];
                // assert(point !== undefined, "Point not found");
                //
                // session = createMovePointSession(
                //     point,
                //     this.canvasStateStore,
                //     this.viewportStore,
                //     this.historyManager,
                // );
            }
            case "SelectionLine.Center": {
                session = createTransformSession(
                    this.historyManager,
                    createMoveTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        { x, y },
                    ),
                );
                break;
            }
            case "SelectionText.Left": {
                this.canvasStateStore.setTextBlockSizingMode("fixed");
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
                        { x, y },
                    ),
                );
                break;
            }
            case "SelectionText.Right": {
                this.canvasStateStore.setTextBlockSizingMode("fixed");
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
                        data.newX,
                        data.newY,
                        this.viewportStore.getState().scale,
                    ).blocks.at(0);

                    if (data.shiftKey) {
                        if (object !== undefined) {
                            this.canvasStateStore.unselect(object.target.id);
                        }
                    } else {
                        if (object !== undefined) {
                            const selectedBlockIds =
                                this.canvasStateStore.getState()
                                    .selectedBlockIds;
                            if (
                                selectedBlockIds.length === 1 &&
                                selectedBlockIds[0] === object.target.id
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
        x: number,
        y: number,
    ): SelectionHandleType | null {
        const THRESHOLD = 16;

        if (this.appStateStore.getState().mode.type !== "select") return null;

        const selectionType = this.getSelectionType();

        if (selectionType === "line") {
            const line = this.canvasStateStore
                .getState()
                .getSelectedBlocks()[0];
            assert(line.type === "line", "Selected block is not line");

            if (
                distanceFromPointToPoint({ x: line.x1, y: line.y1 }, { x, y }) <
                THRESHOLD
            ) {
                return { type: "SelectionLine.P1", line };
            }

            if (
                distanceFromPointToPoint({ x: line.x2, y: line.y2 }, { x, y }) <
                THRESHOLD
            ) {
                return { type: "SelectionLine.P2", line };
            }

            if (distanceFromPointToLine({ x, y }, line).distance < THRESHOLD) {
                {
                    return { type: "SelectionLine.Center", line };
                }
            }
        }

        if (selectionType === "text") {
            const text = this.canvasStateStore
                .getState()
                .getSelectedBlocks()[0];
            assert(text.type === "text", "Selected block is not text");

            const hitAreaX = testHitWithRange(
                x,
                text.x,
                text.x + text.width,
                32,
            );
            if (
                text.y - THRESHOLD < y &&
                y < text.y + text.height + THRESHOLD
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
                x,
                selectionRect.x,
                selectionRect.x + selectionRect.width,
                THRESHOLD,
            );
            const hitAreaY = testHitWithRange(
                y,
                selectionRect.y,
                selectionRect.y + selectionRect.height,
                THRESHOLD,
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
        const selectedBlocks = this.canvasStateStore
            .getState()
            .getSelectedBlocks();

        if (selectedBlocks.length === 0) return "none";

        if (selectedBlocks.length === 1 && selectedBlocks[0].type === "line") {
            return "line";
        }

        if (selectedBlocks.length === 1 && selectedBlocks[0].type === "text") {
            return "text";
        }

        return "rect";
    }
}

type SelectionType = "line" | "rect" | "text" | "none";

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
    | { type: "SelectionLine.P1"; line: LineBlock }
    | { type: "SelectionLine.Center"; line: LineBlock }
    | { type: "SelectionLine.P2"; line: LineBlock }
    | { type: "SelectionText.Left"; text: TextBlock }
    | { type: "SelectionText.Center"; text: TextBlock }
    | { type: "SelectionText.Right"; text: TextBlock };

/**
 * Test if a given value is inside of a range.
 *
 *
 */
function testHitWithRange(
    value: number,
    start: number,
    end: number,
    threshold: number,
): "start" | "middle" | "end" | "none" {
    const outerStart = start - threshold;
    const innerStart =
        end - start < threshold * 4 ? (start * 3 + end) / 4 : start + threshold;
    const innerEnd =
        end - start < threshold * 4 ? (start + end * 3) / 4 : end - threshold;
    const outerEnd = end + threshold;

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
