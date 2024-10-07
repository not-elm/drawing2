import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToPoint } from "../geo/Point";
import {
    type Rect,
    isRectOverlapWithLine,
    isRectOverlapWithRect,
} from "../geo/Rect";
import { getRectanglePath } from "../geo/path";
import type { StateProvider } from "../lib/Store";
import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import {
    type Block,
    type LineBlock,
    type PointEntity,
    PointKey,
    type ShapeBlock,
    type TextBlock,
} from "../model/Page";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextBlockSizingMode } from "../model/TextBlockSizingMode";
import { Transaction } from "../model/Transaction";
import { AppStateStore } from "../store/AppStateStore";
import {
    CanvasStateStore,
    MouseButton,
    fromCanvasCoordinate,
} from "../store/CanvasStateStore";
import { HoverStateStore, testHitEntities } from "../store/HoverStateStore";
import { PointerStateStore } from "../store/PointerStateStore";
import { PropertyPanelStateStore } from "../store/PropertyPanelStateStore";
import { ViewportStore } from "../store/ViewportStore";
import {
    GestureRecognizer,
    type PointerEventSessionHandlers,
} from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import { getRestoreViewportService } from "./RestoreViewportService";

export class Controller {
    readonly canvasStateStore = new CanvasStateStore();
    readonly pointerStore = new PointerStateStore();
    readonly viewportStore = new ViewportStore(getRestoreViewportService());
    readonly gestureRecognizer = new GestureRecognizer(this.viewportStore);
    readonly hoverStateStore = new HoverStateStore(
        this.canvasStateStore,
        this.pointerStore,
        this.viewportStore,
    );
    readonly appStateStore = new AppStateStore();
    readonly propertyPanelStateStore = new PropertyPanelStateStore(
        this.canvasStateStore,
        this.appStateStore,
    );
    readonly historyManager = new HistoryManager(this.canvasStateStore);

    constructor() {
        this.gestureRecognizer.onPointerDown = this.handlePointerDown;
    }

    private readonly handlePointerDown = (
        ev: PointerEvent,
        startSession: (handlers: PointerEventSessionHandlers) => void,
    ) => {
        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );
        const object = this.getObjectFromPoint(x, y);

        switch (ev.button) {
            case MouseButton.Left: {
                switch (object.type) {
                    case "SelectionRect.TopLeftHandle": {
                        startSession(
                            createXYResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.x +
                                    object.selectionRect.width,
                                object.selectionRect.y +
                                    object.selectionRect.height,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.LeftHandle": {
                        startSession(
                            createXResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.x +
                                    object.selectionRect.width,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.BottomLeftHandle": {
                        startSession(
                            createXYResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.x +
                                    object.selectionRect.width,
                                object.selectionRect.y,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.TopHandle": {
                        startSession(
                            createYResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.y +
                                    object.selectionRect.height,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.CenterHandle": {
                        startSession(
                            createMoveSelectedBlocksSessionHandlers(
                                x,
                                y,
                                ev.shiftKey,
                                this.canvasStateStore,
                                this.viewportStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.BottomHandle": {
                        startSession(
                            createYResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.y,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.TopRightHandle": {
                        startSession(
                            createXYResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.x,
                                object.selectionRect.y +
                                    object.selectionRect.height,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.RightHandle": {
                        startSession(
                            createXResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                x,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionRect.BottomRightHandle": {
                        startSession(
                            createXYResizeSessionHandlers(
                                this.canvasStateStore.getState()
                                    .selectedBlockIds,
                                object.selectionRect.x,
                                object.selectionRect.y,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionLine.P1": {
                        const originalPointId = this.canvasStateStore
                            .getState()
                            .page.dependencies.getByToEntityId(object.line.id)
                            .find(
                                (dependency) =>
                                    dependency.type === "blockToPoint" &&
                                    dependency.pointKey === PointKey.LINE_P1,
                            )?.from;
                        assert(
                            originalPointId !== undefined,
                            "LineEndPoint 1 is not found",
                        );

                        const originalPoint =
                            this.canvasStateStore.getState().page.points[
                                originalPointId
                            ];
                        assert(
                            originalPoint !== undefined,
                            `Point ${originalPointId} is not found`,
                        );

                        startSession(
                            createMovePointSessionHandlers(
                                originalPoint,
                                this.canvasStateStore,
                                this.viewportStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionLine.P2": {
                        const originalPointId = this.canvasStateStore
                            .getState()
                            .page.dependencies.getByToEntityId(object.line.id)
                            .find(
                                (dependency) =>
                                    dependency.type === "blockToPoint" &&
                                    dependency.pointKey === PointKey.LINE_P2,
                            )?.from;
                        assert(
                            originalPointId !== undefined,
                            "LineEndPoint 1 is not found",
                        );

                        const originalPoint =
                            this.canvasStateStore.getState().page.points[
                                originalPointId
                            ];
                        assert(
                            originalPoint !== undefined,
                            `Point ${originalPointId} is not found`,
                        );

                        startSession(
                            createMovePointSessionHandlers(
                                originalPoint,
                                this.canvasStateStore,
                                this.viewportStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionLine.Center": {
                        startSession(
                            createMoveSelectedBlocksSessionHandlers(
                                x,
                                y,
                                ev.shiftKey,
                                this.canvasStateStore,
                                this.viewportStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionText.Left": {
                        this.canvasStateStore.setTextBlockSizingMode("fixed");
                        startSession(
                            createXResizeSessionHandlers(
                                [object.text.id],
                                object.text.x + object.text.width,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionText.Center": {
                        startSession(
                            createMoveSelectedBlocksSessionHandlers(
                                x,
                                y,
                                ev.shiftKey,
                                this.canvasStateStore,
                                this.viewportStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "SelectionText.Right": {
                        this.canvasStateStore.setTextBlockSizingMode("fixed");
                        startSession(
                            createXResizeSessionHandlers(
                                [object.text.id],
                                object.text.x,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "Block": {
                        switch (this.appStateStore.getState().mode.type) {
                            case "text": {
                                this.setMode({ type: "select" });
                                this.canvasStateStore.unselectAll();
                                this.canvasStateStore.select(object.block.id);
                                break;
                            }
                        }
                        startSession(
                            createMoveBlockSessionHandlers(
                                object.block.id,
                                ev.shiftKey,
                                this.canvasStateStore,
                                this.historyManager,
                            ),
                        );
                        return;
                    }
                    case "Canvas": {
                        switch (this.appStateStore.getState().mode.type) {
                            case "select": {
                                if (!ev.shiftKey) {
                                    this.canvasStateStore.unselectAll();
                                }
                                startSession(
                                    createSelectByRangeSessionHandlers(
                                        this.canvasStateStore,
                                    ),
                                );
                                return;
                            }
                            case "shape": {
                                startSession(
                                    createNewShapeSessionHandlers(
                                        this,
                                        this.canvasStateStore,
                                        this.appStateStore,
                                    ),
                                );
                                return;
                            }
                            case "line": {
                                startSession(
                                    createNewLineSessionHandlers(
                                        this,
                                        this.canvasStateStore,
                                        this.viewportStore,
                                        this.appStateStore,
                                    ),
                                );
                                return;
                            }
                            case "text": {
                                if (!ev.shiftKey) {
                                    this.canvasStateStore.unselectAll();
                                }
                                this.setMode({ type: "select" });
                                startSession(
                                    createSelectByRangeSessionHandlers(
                                        this.canvasStateStore,
                                    ),
                                );
                                return;
                            }
                            case "new-text": {
                                const text: TextBlock = {
                                    id: randomId(),
                                    type: "text",
                                    x,
                                    y,
                                    x1: x,
                                    y1: y,
                                    x2: x,
                                    y2: y,
                                    width: 0,
                                    height: 0,
                                    content: "",
                                    textAlignment:
                                        this.appStateStore.getState()
                                            .defaultTextBlockTextAlignment,
                                    sizingMode: "content",
                                };
                                const p1: PointEntity = {
                                    type: "point",
                                    id: randomId(),
                                    x,
                                    y,
                                };
                                const p2: PointEntity = {
                                    type: "point",
                                    id: randomId(),
                                    x,
                                    y,
                                };
                                this.canvasStateStore.setPage(
                                    new Transaction(
                                        this.canvasStateStore.getState().page,
                                    )
                                        .insertBlocks([text])
                                        .insertPoints([p1, p2])
                                        .addDependencies([
                                            {
                                                id: randomId(),
                                                type: "blockToPoint",
                                                pointKey: PointKey.TEXT_P1,
                                                from: p1.id,
                                                to: text.id,
                                            },
                                            {
                                                id: randomId(),
                                                type: "blockToPoint",
                                                pointKey: PointKey.TEXT_P2,
                                                from: p2.id,
                                                to: text.id,
                                            },
                                        ])
                                        .commit(),
                                );
                                this.setMode({
                                    type: "text",
                                    blockId: text.id,
                                });

                                // To leave focus at the new text block
                                ev.preventDefault();
                                return;
                            }
                        }
                        break;
                    }
                }
            }
        }
    };

    handleCanvasMouseDown(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerDown(ev);
    }

    handleCanvasMouseMove(canvasX: number, canvasY: number, ev: PointerEvent) {
        this.gestureRecognizer.handlePointerMove(ev);

        const viewport = this.viewportStore.getState();
        this.pointerStore.setPosition(
            canvasX / viewport.scale + viewport.x,
            canvasY / viewport.scale + viewport.y,
        );
    }

    handleCanvasMouseUp(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerUp(ev);
    }

    handleShapeDoubleClick(
        id: string,
        canvasX: number,
        canvasY: number,
        mouseButton: number,
        modifiers: { shiftKey: boolean },
    ) {
        switch (mouseButton) {
            case MouseButton.Left: {
                this.canvasStateStore.unselectAll();
                this.canvasStateStore.select(id);
                this.setMode({ type: "text", blockId: id });
                return true;
            }
        }

        return false;
    }

    handleScroll(deltaCanvasX: number, deltaCanvasY: number) {
        this.viewportStore.movePosition(deltaCanvasX, deltaCanvasY);
    }

    handleScale(
        newScale: number,
        centerCanvasX: number,
        centerCanvasY: number,
    ) {
        this.viewportStore.setScale(newScale, centerCanvasX, centerCanvasY);
    }

    handleKeyDown(
        key: string,
        modifiers: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean },
    ): boolean {
        switch (key) {
            case "a": {
                switch (this.appStateStore.getState().mode.type) {
                    case "line":
                    case "shape":
                    case "new-text":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.setMode({ type: "select" });
                            this.canvasStateStore.selectAll();
                            return true;
                        }
                    }
                }
                break;
            }
            case "r": {
                switch (this.appStateStore.getState().mode.type) {
                    case "line":
                    case "new-text":
                    case "select": {
                        this.setMode({ type: "shape" });
                        return true;
                    }
                }
                break;
            }
            case "t": {
                switch (this.appStateStore.getState().mode.type) {
                    case "shape":
                    case "line":
                    case "select": {
                        this.setMode({ type: "new-text" });
                        return true;
                    }
                }
                break;
            }
            case "l": {
                switch (this.appStateStore.getState().mode.type) {
                    case "shape":
                    case "select": {
                        this.setMode({ type: "line" });
                        return true;
                    }
                }
                break;
            }
            case "z": {
                switch (this.appStateStore.getState().mode.type) {
                    case "line":
                    case "shape":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            if (modifiers.shiftKey) {
                                this.historyManager.redo();
                            } else {
                                this.historyManager.undo();
                            }
                            return true;
                        }
                    }
                }
                break;
            }
            case "x": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.canvasStateStore.cut();
                        }
                        return true;
                    }
                }
                break;
            }
            case "c": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.canvasStateStore.copy();
                        }
                        return true;
                    }
                }
                break;
            }
            case "v": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.canvasStateStore.paste();
                        }
                        return true;
                    }
                }
                break;
            }
            case "Escape": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        this.canvasStateStore.unselectAll();
                        return true;
                    }
                    default: {
                        this.setMode({ type: "select" });
                        return true;
                    }
                }
            }
            case "Delete":
            case "Backspace": {
                switch (this.appStateStore.getState().mode.type) {
                    case "select": {
                        this.canvasStateStore.deleteSelectedBlocks();
                        return true;
                    }
                }
                break;
            }
        }

        return false;
    }

    handleTextBlockSizeChanged(
        blockId: string,
        canvasWidth: number,
        canvasHeight: number,
    ) {
        const block = this.canvasStateStore.getState().page.blocks[blockId];
        assert(block !== undefined, `Block ${blockId} is not found`);
        assert(block.type === "text", `Block ${blockId} is not text`);

        const width = canvasWidth / this.viewportStore.getState().scale;
        const height = canvasHeight / this.viewportStore.getState().scale;

        const dep1 = this.canvasStateStore
            .getState()
            .page.dependencies.getByToEntityId(blockId)
            .find(
                (dep) =>
                    dep.type === "blockToPoint" &&
                    dep.pointKey === PointKey.TEXT_P1,
            );
        assert(dep1 !== undefined, `Point ${PointKey.TEXT_P1} is not found`);

        const dep2 = this.canvasStateStore
            .getState()
            .page.dependencies.getByToEntityId(blockId)
            .find(
                (dep) =>
                    dep.type === "blockToPoint" &&
                    dep.pointKey === PointKey.TEXT_P2,
            );
        assert(dep2 !== undefined, `Point ${PointKey.TEXT_P2} is not found`);

        switch (block.sizingMode) {
            case "fixed": {
                this.canvasStateStore.setPage(
                    new Transaction(this.canvasStateStore.getState().page)
                        .setPointPosition(dep1.from, block.x, block.y)
                        .setPointPosition(
                            dep2.from,
                            block.x + block.width,
                            block.y + height,
                        )
                        .commit(),
                );
                break;
            }
            case "content": {
                this.canvasStateStore.setPage(
                    new Transaction(this.canvasStateStore.getState().page)
                        .setPointPosition(dep1.from, block.x, block.y)
                        .setPointPosition(
                            dep2.from,
                            block.x + width,
                            block.y + height,
                        )
                        .commit(),
                );
            }
        }
    }

    setMode(mode: Mode) {
        const oldMode = this.appStateStore.getState().mode;
        switch (oldMode.type) {
            case "text": {
                const blockId = oldMode.blockId;
                const block =
                    this.canvasStateStore.getState().page.blocks[blockId];
                assert(block !== undefined, `Block ${blockId} is not found`);
                assert(block.type === "text", `Block ${blockId} is not text`);

                if (block.content === "") {
                    this.canvasStateStore.setPage(
                        new Transaction(this.canvasStateStore.getState().page)
                            .deleteBlocks([blockId])
                            .commit(),
                    );
                }
                break;
            }
        }

        this.appStateStore.setMode(mode);
    }

    setLabelText(id: string, label: string) {
        this.canvasStateStore.setLabel(id, label);
    }

    setTextAlign(alignX: TextAlignment, alignY: TextAlignment) {
        this.canvasStateStore.setTextAlign(alignX, alignY);
        this.appStateStore.setDefaultTextAlign(alignX, alignY);
    }

    setColor(colorId: ColorId) {
        this.canvasStateStore.setColor(colorId);
        this.appStateStore.setDefaultColor(colorId);
    }

    setFillMode(fillMode: FillMode) {
        this.canvasStateStore.setFillMode(fillMode);
        this.appStateStore.setDefaultFillMode(fillMode);
    }

    setLineEndType(lineEnd: 1 | 2, endType: LineEndType) {
        this.canvasStateStore.setLineEndType(lineEnd, endType);
        this.appStateStore.setDefaultLineEnd(lineEnd, endType);
    }

    setTextBlockTextAlignment(alignment: TextAlignment) {
        this.canvasStateStore.setTextBlockTextAlignment(alignment);
        this.appStateStore.setDefaultTextBlockTextAlignment(alignment);
    }

    setTextBlockSizingMode(sizingMode: TextBlockSizingMode) {
        this.canvasStateStore.setTextBlockSizingMode(sizingMode);
        this.appStateStore.setDefaultTextBlockSizingMode(sizingMode);
    }

    bringSelectedBlocksToFront() {
        this.canvasStateStore.bringToFront();
    }

    bringSelectedBlocksForward() {
        this.canvasStateStore.bringForward();
    }

    sendSelectedBlocksBackward() {
        this.canvasStateStore.sendBackward();
    }

    sendSelectedBlocksToBack() {
        this.canvasStateStore.sendToBack();
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

    private getObjectFromPoint(x: number, y: number): GetObjectFromPointResult {
        const THRESHOLD = 32;

        switch (this.appStateStore.getState().mode.type) {
            case "select": {
                const selectionType = this.getSelectionType();

                if (selectionType === "line") {
                    const line = this.canvasStateStore
                        .getState()
                        .getSelectedBlocks()[0];
                    assert(line.type === "line", "Selected block is not line");

                    if (
                        distanceFromPointToPoint(
                            { x: line.x1, y: line.y1 },
                            { x, y },
                        ) < THRESHOLD
                    ) {
                        return { type: "SelectionLine.P1", line };
                    }

                    if (
                        distanceFromPointToPoint(
                            { x: line.x2, y: line.y2 },
                            { x, y },
                        ) < THRESHOLD
                    ) {
                        return { type: "SelectionLine.P2", line };
                    }

                    if (
                        distanceFromPointToLine({ x, y }, line).distance <
                        THRESHOLD
                    ) {
                        {
                            return { type: "SelectionLine.Center", line };
                        }
                    }
                }

                if (selectionType === "text") {
                    const text = this.canvasStateStore
                        .getState()
                        .getSelectedBlocks()[0];
                    assert(text.type === "text", "Selected block is not line");

                    const hitAreaX = testHitWithRange(
                        x,
                        text.x,
                        text.x + text.width,
                        32,
                    );
                    if (text.y - THRESHOLD < y && y < text.y + THRESHOLD) {
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
                    assert(
                        selectionRect !== null,
                        "SelectionRect must not be null",
                    );
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

                {
                    const hitResult = testHitEntities(
                        this.canvasStateStore.getState().page,
                        x,
                        y,
                        this.viewportStore.getState().scale,
                    );
                    if (hitResult.blocks.length > 0) {
                        return {
                            type: "Block",
                            block: hitResult.blocks[0].target,
                        };
                    }
                }

                break;
            }
            case "text": {
                // Block
                {
                    const hitResult = testHitEntities(
                        this.canvasStateStore.getState().page,
                        x,
                        y,
                        this.viewportStore.getState().scale,
                    );
                    if (hitResult.blocks.length > 0) {
                        return {
                            type: "Block",
                            block: hitResult.blocks[0].target,
                        };
                    }
                }

                break;
            }
            case "line":
            case "shape":
            case "new-text": {
                break;
            }
        }

        return { type: "Canvas" };
    }
}

type SelectionType = "line" | "rect" | "text" | "none";

type GetObjectFromPointResult =
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
    | { type: "SelectionText.Right"; text: TextBlock }
    | { type: "Block"; block: Block }
    | { type: "Canvas" };

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
        end - start < threshold * 4
            ? (start * 3 + end * 1) / 4
            : start + threshold;
    const innerEnd =
        end - start < threshold * 4
            ? (start * 1 + end * 3) / 4
            : end - threshold;
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

function createNewLineSessionHandlers(
    controller: Controller,
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    appStateStore: AppStateStore,
): PointerEventSessionHandlers {
    return {
        type: "new-line",
        onPointerUp: (data) => {
            const page = canvasStateStore.getState().page;
            const scale = viewportProvider.getState().scale;
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );

            let p1: PointEntity;
            const hitTestResult1 = testHitEntities(
                page,
                data.startX,
                data.startY,
                scale,
            );

            if (hitTestResult1.entities.length === 0) {
                p1 = {
                    type: "point",
                    id: randomId(),
                    x: data.startX,
                    y: data.startY,
                };
                transaction.insertPoints([p1]);
            } else if (hitTestResult1.points.length > 0) {
                p1 = hitTestResult1.points[0].target;
            } else {
                const hitEntry = hitTestResult1.blocks[0];
                switch (hitEntry.target.type) {
                    case "line": {
                        const width = hitEntry.target.x2 - hitEntry.target.x1;
                        const height = hitEntry.target.y2 - hitEntry.target.y1;
                        const relativePosition =
                            width > height
                                ? (hitEntry.point.x - hitEntry.target.x1) /
                                  width
                                : (hitEntry.point.y - hitEntry.target.y1) /
                                  height;
                        p1 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p1]).addDependencies([
                            {
                                type: "pointOnLine",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p1.id,
                                r: relativePosition,
                            },
                        ]);
                        break;
                    }
                    case "shape":
                    case "text": {
                        const rx =
                            (hitEntry.point.x - hitEntry.target.x) /
                            hitEntry.target.width;
                        const ry =
                            (hitEntry.point.y - hitEntry.target.y) /
                            hitEntry.target.height;
                        p1 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p1]).addDependencies([
                            {
                                type: "pointOnShape",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p1.id,
                                rx,
                                ry,
                            },
                        ]);
                    }
                }
            }

            let p2: PointEntity;
            const hitTestResult2 = testHitEntities(
                page,
                data.newX,
                data.newY,
                scale,
            );

            if (hitTestResult2.entities.length === 0) {
                p2 = {
                    type: "point",
                    id: randomId(),
                    x: data.newX,
                    y: data.newY,
                };
                transaction.insertPoints([p2]);
            } else if (hitTestResult2.points.length > 0) {
                p2 = hitTestResult2.points[0].target;
            } else {
                const hitEntry = hitTestResult2.blocks[0];
                switch (hitEntry.target.type) {
                    case "line": {
                        const width = hitEntry.target.x2 - hitEntry.target.x1;
                        const height = hitEntry.target.y2 - hitEntry.target.y1;
                        const relativePosition =
                            width > height
                                ? (hitEntry.point.x - hitEntry.target.x1) /
                                  width
                                : (hitEntry.point.y - hitEntry.target.y1) /
                                  height;
                        p2 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p2]).addDependencies([
                            {
                                type: "pointOnLine",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p2.id,
                                r: relativePosition,
                            },
                        ]);
                        break;
                    }
                    case "shape":
                    case "text": {
                        const rx =
                            (hitEntry.point.x - hitEntry.target.x) /
                            hitEntry.target.width;
                        const ry =
                            (hitEntry.point.y - hitEntry.target.y) /
                            hitEntry.target.height;
                        p2 = {
                            type: "point",
                            id: randomId(),
                            x: hitEntry.point.x,
                            y: hitEntry.point.y,
                        };
                        transaction.insertPoints([p2]).addDependencies([
                            {
                                type: "pointOnShape",
                                id: randomId(),
                                from: hitEntry.target.id,
                                to: p2.id,
                                rx,
                                ry,
                            },
                        ]);
                    }
                }
            }

            const line: LineBlock = {
                id: randomId(),
                type: "line",
                x1: p1.x,
                y1: p1.y,
                endType1: appStateStore.getState().defaultLineEndType1,
                x2: p2.x,
                y2: p2.y,
                endType2: appStateStore.getState().defaultLineEndType2,
                colorId: appStateStore.getState().defaultColorId,
            };
            transaction.insertBlocks([line]).addDependencies([
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.LINE_P1,
                    from: p1.id,
                    to: line.id,
                },
                {
                    id: randomId(),
                    type: "blockToPoint",
                    pointKey: PointKey.LINE_P2,
                    from: p2.id,
                    to: line.id,
                },
            ]);

            canvasStateStore.setPage(transaction.commit());
            controller.setMode({ type: "select" });
            canvasStateStore.unselectAll();
            canvasStateStore.select(line.id);
        },
    };
}

function createNewShapeSessionHandlers(
    controller: Controller,
    canvasStateStore: CanvasStateStore,
    appStateStore: AppStateStore,
): PointerEventSessionHandlers {
    return {
        type: "new-shape",
        onPointerUp: (data) => {
            const width = Math.abs(data.newX - data.startX);
            const height = Math.abs(data.newY - data.startY);
            if (width === 0 || height === 0) return;

            const x = Math.min(data.startX, data.newX);
            const y = Math.min(data.startY, data.newY);
            const shape: ShapeBlock = {
                type: "shape",
                id: randomId(),
                x,
                y,
                width,
                height,
                x1: x,
                y1: y,
                x2: x + width,
                y2: y + height,
                label: "",
                textAlignX: appStateStore.getState().defaultTextAlignX,
                textAlignY: appStateStore.getState().defaultTextAlignY,
                colorId: appStateStore.getState().defaultColorId,
                fillMode: appStateStore.getState().defaultFillMode,
                path: getRectanglePath(),
            };
            // const shape: TextBlock = {
            //     type: "text",
            //     id: randomId(),
            //     x,
            //     y,
            //     width,
            //     height,
            //     x1: x,
            //     y1: y,
            //     x2: x + width,
            //     y2: y + height,
            //     content: "Hello World",
            //     textAlignX: appStateStore.getState().defaultTextAlignX,
            //     sizingMode: "fixed",
            // };
            const p1: PointEntity = {
                type: "point",
                id: randomId(),
                x,
                y,
            };
            const p2: PointEntity = {
                type: "point",
                id: randomId(),
                x: x + width,
                y: y + height,
            };
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            )
                .insertBlocks([shape])
                .insertPoints([p1, p2])
                .addDependencies([
                    {
                        id: randomId(),
                        type: "blockToPoint",
                        pointKey: PointKey.SHAPE_P1,
                        from: p1.id,
                        to: shape.id,
                    },
                    {
                        id: randomId(),
                        type: "blockToPoint",
                        pointKey: PointKey.SHAPE_P2,
                        from: p2.id,
                        to: shape.id,
                    },
                ]);
            canvasStateStore.setPage(transaction.commit());
            controller.setMode({ type: "select" });
            canvasStateStore.unselectAll();
            canvasStateStore.select(shape.id);
        },
    };
}

function createMoveSelectedBlocksSessionHandlers(
    x: number,
    y: number,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
    viewportStore: ViewportStore,
    historyManager: HistoryManager,
): PointerEventSessionHandlers {
    const hitResult = testHitEntities(
        canvasStateStore.getState().page,
        x,
        y,
        viewportStore.getState().scale,
    );
    historyManager.pause();

    return {
        type: "move",
        onPointerMove: (data) => {
            canvasStateStore.moveBlocks(
                canvasStateStore.getState().selectedBlockIds,
                data.newX - data.lastX,
                data.newY - data.lastY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
        onClick: () => {
            if (hitResult.blocks.length > 0) {
                if (shiftKey) {
                    canvasStateStore.toggleSelect(
                        hitResult.blocks[0].target.id,
                    );
                } else {
                    canvasStateStore.unselectAll();
                    canvasStateStore.select(hitResult.blocks[0].target.id);
                }
            }
            historyManager.resume();
        },
    };
}

function createMoveBlockSessionHandlers(
    blockId: string,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): PointerEventSessionHandlers {
    if (!shiftKey) {
        canvasStateStore.unselectAll();
    }
    canvasStateStore.select(blockId);
    historyManager.pause();

    return {
        type: "move",
        onPointerMove: (data) => {
            canvasStateStore.moveBlocks(
                canvasStateStore.getState().selectedBlockIds,
                data.newX - data.lastX,
                data.newY - data.lastY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}

function createMovePointSessionHandlers(
    originalPoint: PointEntity,
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
    historyManager: HistoryManager,
): PointerEventSessionHandlers {
    const ignoreEntityIds = new Set([originalPoint.id]);
    const connectedLineIds = canvasStateStore
        .getState()
        .page.dependencies.getByFromEntityId(originalPoint.id)
        .map((dep) => dep.to);
    for (const lineId of connectedLineIds) {
        ignoreEntityIds.add(lineId);
    }

    const dependenciesToPoint = canvasStateStore
        .getState()
        .page.dependencies.getByToEntityId(originalPoint.id)
        .filter(
            (dep) => dep.type === "pointOnShape" || dep.type === "pointOnLine",
        );
    historyManager.pause();

    return {
        type: "move-point",
        onPointerMove: (data) => {
            const hitTestResult = testHitEntities(
                canvasStateStore.getState().page,
                data.newX,
                data.newY,
                viewportProvider.getState().scale,
            );

            const hitPointEntry = hitTestResult.points.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];
            const hitBlockEntry = hitTestResult.blocks.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];
            const hitEntry = hitPointEntry ?? hitBlockEntry;

            const x =
                hitEntry?.point.x ??
                originalPoint.x + (data.newX - data.startX);
            const y =
                hitEntry?.point.y ??
                originalPoint.y + (data.newY - data.startY);

            canvasStateStore.setPage(
                new Transaction(canvasStateStore.getState().page)
                    .setPointPosition(originalPoint.id, x, y)
                    .commit(),
            );
        },
        onPointerUp: (data) => {
            const transaction = new Transaction(
                canvasStateStore.getState().page,
            );
            transaction.deleteDependencies(
                dependenciesToPoint.map((dep) => dep.id),
            );

            const hitTestResult = testHitEntities(
                canvasStateStore.getState().page,
                data.newX,
                data.newY,
                viewportProvider.getState().scale,
            );

            const hitPointEntry = hitTestResult.points.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];
            const hitBlockEntry = hitTestResult.blocks.filter(
                (item) => !ignoreEntityIds.has(item.target.id),
            )[0];

            if (hitPointEntry !== undefined) {
                transaction.mergePoints(
                    originalPoint.id,
                    hitPointEntry.target.id,
                );
            } else {
                switch (hitBlockEntry?.target.type) {
                    case "line": {
                        const width =
                            hitBlockEntry.target.x2 - hitBlockEntry.target.x1;
                        const height =
                            hitBlockEntry.target.y2 - hitBlockEntry.target.y1;

                        const r =
                            width > height
                                ? (hitBlockEntry.point.x -
                                      hitBlockEntry.target.x1) /
                                  width
                                : (hitBlockEntry.point.y -
                                      hitBlockEntry.target.y1) /
                                  height;

                        transaction.addDependencies([
                            {
                                id: randomId(),
                                type: "pointOnLine",
                                from: hitBlockEntry.target.id,
                                to: originalPoint.id,
                                r: r,
                            },
                        ]);
                        break;
                    }
                    case "shape": {
                        const rx =
                            (hitBlockEntry.point.x - hitBlockEntry.target.x) /
                            hitBlockEntry.target.width;
                        const ry =
                            (hitBlockEntry.point.y - hitBlockEntry.target.y) /
                            hitBlockEntry.target.height;

                        transaction.addDependencies([
                            {
                                id: randomId(),
                                type: "pointOnShape",
                                from: hitBlockEntry.target.id,
                                to: originalPoint.id,
                                rx,
                                ry,
                            },
                        ]);
                        break;
                    }
                }
            }

            canvasStateStore.setPage(transaction.commit());
            historyManager.resume();
        },
    };
}

function createSelectByRangeSessionHandlers(
    canvasStateStore: CanvasStateStore,
): PointerEventSessionHandlers {
    const originalSelectedBlockIds =
        canvasStateStore.getState().selectedBlockIds;

    return {
        type: "selector",
        onPointerMove: (data) => {
            const selectionRect = {
                x: Math.min(data.startX, data.newX),
                y: Math.min(data.startY, data.newY),
                width: Math.abs(data.newX - data.startX),
                height: Math.abs(data.newY - data.startY),
            };
            const selectedBlockIds = new Set(originalSelectedBlockIds);

            for (const block of Object.values(
                canvasStateStore.getState().page.blocks,
            )) {
                switch (block.type) {
                    case "shape":
                    case "text": {
                        if (isRectOverlapWithRect(selectionRect, block)) {
                            selectedBlockIds.add(block.id);
                        }
                        break;
                    }
                    case "line": {
                        if (isRectOverlapWithLine(selectionRect, block)) {
                            selectedBlockIds.add(block.id);
                        }
                        break;
                    }
                }
            }

            canvasStateStore.setSelectedBlockIds([...selectedBlockIds]);
        },
    };
}

function createXYResizeSessionHandlers(
    blockIds: string[],
    originX: number,
    originY: number,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): PointerEventSessionHandlers {
    historyManager.pause();

    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.scaleBlocks(
                blockIds,
                (data.newX - originX) / (data.lastX - originX),
                (data.newY - originY) / (data.lastY - originY),
                originX,
                originY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}

function createXResizeSessionHandlers(
    blockIds: string[],
    originX: number,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): PointerEventSessionHandlers {
    historyManager.pause();

    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.scaleBlocks(
                blockIds,
                (data.newX - originX) / (data.lastX - originX),
                1,
                originX,
                0,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}

function createYResizeSessionHandlers(
    blockIds: string[],
    originY: number,
    canvasStateStore: CanvasStateStore,
    historyManager: HistoryManager,
): PointerEventSessionHandlers {
    historyManager.pause();

    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.scaleBlocks(
                blockIds,
                1,
                (data.newY - originY) / (data.lastY - originY),
                0,
                originY,
            );
        },
        onPointerUp: () => {
            historyManager.resume();
        },
    };
}
