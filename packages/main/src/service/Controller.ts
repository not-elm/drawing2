import { distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToPoint } from "../geo/Point";
import type { Rect } from "../geo/Rect";
import { getRectanglePath } from "../geo/path";
import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import { testHitEntities } from "../lib/testHitEntities";
import type { ColorId } from "../model/Colors";
import { Direction } from "../model/Direction";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import {
    type LineBlock,
    type PointEntity,
    PointKey,
    type ShapeBlock,
    type TextBlock,
} from "../model/Page";
import type { StrokeStyle } from "../model/StrokeStyle";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextBlockSizingMode } from "../model/TextBlockSizingMode";
import { Transaction } from "../model/Transaction";
import {
    createMoveTransformHandle,
    createScaleTransformHandle,
} from "../model/TransformHandle";
import { AppStateStore } from "../store/AppStateStore";
import { BrushStore } from "../store/BrushStore";
import {
    CanvasStateStore,
    fromCanvasCoordinate,
} from "../store/CanvasStateStore";
import { PropertyPanelStateStore } from "../store/PropertyPanelStateStore";
import { SnapGuideStore } from "../store/SnapGuideStore";
import { ViewportStore } from "../store/ViewportStore";
import { GestureRecognizer } from "./GestureRecognizer";
import { HistoryManager } from "./HistoryManager";
import {
    type PointerEventHandlers,
    mergeHandlers,
} from "./PointerEventSession/PointerEventSession";
import { createBrushSelectSession } from "./PointerEventSession/createBrushSelectSession";
import { createMovePointSession } from "./PointerEventSession/createMovePointSession";
import { createTransformSession } from "./PointerEventSession/createTransformSession";
import { getRestoreViewportService } from "./RestoreViewportService";

export class Controller {
    readonly canvasStateStore = new CanvasStateStore();
    readonly viewportStore = new ViewportStore(getRestoreViewportService());
    readonly gestureRecognizer = new GestureRecognizer(this.viewportStore);
    readonly appStateStore = new AppStateStore();
    readonly propertyPanelStateStore = new PropertyPanelStateStore(
        this.canvasStateStore,
        this.appStateStore,
    );
    readonly historyManager = new HistoryManager(this.canvasStateStore);
    readonly snapGuideStore = new SnapGuideStore();
    readonly brushStore = new BrushStore();

    constructor() {
        this.gestureRecognizer.onPointerDown = this.handlePointerDown;
    }

    private readonly handlePointerDown = (
        ev: PointerEvent,
        startSession: (handlers: PointerEventHandlers) => void,
    ) => {
        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );

        const selectionHandle = this.getSelectionHandleType(x, y);

        if (selectionHandle !== null) {
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
                    const pId = this.canvasStateStore
                        .getState()
                        .page.dependencies.getByToEntityId(
                            selectionHandle.line.id,
                        )
                        .filter((d) => d.type === "blockToPoint")
                        .filter((d) => d.pointKey === PointKey.LINE_P1)[0];
                    assert(pId !== undefined, "Point not found");

                    const point =
                        this.canvasStateStore.getState().page.points[pId.from];
                    assert(point !== undefined, "Point not found");

                    session = createMovePointSession(
                        point,
                        this.canvasStateStore,
                        this.viewportStore,
                        this.historyManager,
                    );
                    break;
                }
                case "SelectionLine.P2": {
                    const pId = this.canvasStateStore
                        .getState()
                        .page.dependencies.getByToEntityId(
                            selectionHandle.line.id,
                        )
                        .filter((d) => d.type === "blockToPoint")
                        .filter((d) => d.pointKey === PointKey.LINE_P2)[0];
                    assert(pId !== undefined, "Point not found");

                    const point =
                        this.canvasStateStore.getState().page.points[pId.from];
                    assert(point !== undefined, "Point not found");

                    session = createMovePointSession(
                        point,
                        this.canvasStateStore,
                        this.viewportStore,
                        this.historyManager,
                    );
                    break;
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
                            Direction.left,
                        ),
                    );
                    break;
                }
            }

            startSession(
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
                                this.canvasStateStore.unselect(
                                    object.target.id,
                                );
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
                                    this.startTextEditing(object.target.id);
                                } else {
                                    this.canvasStateStore.unselectAll();
                                    this.canvasStateStore.select(
                                        object.target.id,
                                    );
                                }
                            } else {
                                this.canvasStateStore.unselectAll();
                            }
                        }
                    },
                }),
            );

            return;
        }

        if (!ev.shiftKey) {
            this.canvasStateStore.unselectAll();
        }

        const hitResult = testHitEntities(
            this.canvasStateStore.getState().page,
            x,
            y,
            this.viewportStore.getState().scale,
        );
        if (hitResult.blocks.length > 0) {
            const block = hitResult.blocks[0];
            this.canvasStateStore.select(block.target.id);

            startSession(
                createTransformSession(
                    this.historyManager,
                    createMoveTransformHandle(
                        this.canvasStateStore,
                        this.viewportStore,
                        this.snapGuideStore,
                        { x, y },
                    ),
                ),
            );
            return;
        } else {
            switch (this.appStateStore.getState().mode.type) {
                case "new-line": {
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
                    const line: LineBlock = {
                        type: "line",
                        id: randomId(),
                        x1: x,
                        y1: y,
                        x2: x,
                        y2: y,
                        endType1:
                            this.appStateStore.getState().defaultLineEndType1,
                        endType2:
                            this.appStateStore.getState().defaultLineEndType2,
                        colorId: this.appStateStore.getState().defaultColorId,
                        strokeStyle:
                            this.appStateStore.getState().defaultStrokeStyle,
                    };
                    const transaction = new Transaction(
                        this.canvasStateStore.getState().page,
                    );
                    transaction
                        .insertBlocks([line])
                        .insertPoints([p1, p2])
                        .addDependencies([
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

                    this.canvasStateStore.setPage(transaction.commit());
                    this.setMode({ type: "select" });
                    this.canvasStateStore.unselectAll();
                    this.canvasStateStore.select(line.id);

                    startSession(
                        createMovePointSession(
                            p2,
                            this.canvasStateStore,
                            this.viewportStore,
                            this.historyManager,
                        ),
                    );
                    break;
                }
                case "new-shape": {
                    const shape: ShapeBlock = {
                        type: "shape",
                        id: randomId(),
                        x,
                        y,
                        width: 0,
                        height: 0,
                        x1: x,
                        y1: y,
                        x2: x + 1,
                        y2: y + 1,
                        label: "",
                        textAlignX:
                            this.appStateStore.getState().defaultTextAlignX,
                        textAlignY:
                            this.appStateStore.getState().defaultTextAlignY,
                        colorId: this.appStateStore.getState().defaultColorId,
                        fillMode: this.appStateStore.getState().defaultFillMode,
                        strokeStyle:
                            this.appStateStore.getState().defaultStrokeStyle,
                        path: getRectanglePath(),
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
                        x: x + 1,
                        y: y + 1,
                    };
                    const transaction = new Transaction(
                        this.canvasStateStore.getState().page,
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
                    this.canvasStateStore.setPage(transaction.commit());
                    this.setMode({ type: "select" });
                    this.canvasStateStore.unselectAll();
                    this.canvasStateStore.select(shape.id);

                    startSession(
                        createTransformSession(
                            this.historyManager,
                            createScaleTransformHandle(
                                this.canvasStateStore,
                                this.viewportStore,
                                this.snapGuideStore,
                                Direction.bottomRight,
                            ),
                        ),
                    );
                    break;
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
                        new Transaction(this.canvasStateStore.getState().page)
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
                        type: "edit-text",
                        blockId: text.id,
                    });

                    // To leave focus at the new text block
                    ev.preventDefault();
                    break;
                }
                case "edit-text": {
                    this.setMode({ type: "select" });
                    startSession(
                        createBrushSelectSession(
                            this.canvasStateStore,
                            this.brushStore,
                        ),
                    );
                    break;
                }
                case "select": {
                    startSession(
                        createBrushSelectSession(
                            this.canvasStateStore,
                            this.brushStore,
                        ),
                    );
                    break;
                }
            }
        }
    };

    handleCanvasMouseDown(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerDown(ev);
    }

    handleCanvasMouseMove(canvasX: number, canvasY: number, ev: PointerEvent) {
        this.gestureRecognizer.handlePointerMove(ev);

        const [x, y] = fromCanvasCoordinate(
            canvasX,
            canvasY,
            this.viewportStore.getState(),
        );

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

    handleCanvasMouseUp(ev: PointerEvent) {
        this.gestureRecognizer.handlePointerUp(ev);
    }

    handleCanvasDoubleClick(ev: MouseEvent) {
        const [x, y] = fromCanvasCoordinate(
            ev.clientX,
            ev.clientY,
            this.viewportStore.getState(),
        );

        const hitResult = testHitEntities(
            this.canvasStateStore.getState().page,
            x,
            y,
            this.viewportStore.getState().scale,
        );

        if (hitResult.blocks.length === 0) {
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
                    this.appStateStore.getState().defaultTextBlockTextAlignment,
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
                new Transaction(this.canvasStateStore.getState().page)
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
                type: "edit-text",
                blockId: text.id,
            });

            // To leave focus at the new text block
            ev.preventDefault();
            return;
        }
    }

    startTextEditing(blockId: string) {
        const oldState = this.appStateStore.getState();
        if (
            oldState.mode.type === "edit-text" &&
            oldState.mode.blockId === blockId
        ) {
            return;
        }

        this.canvasStateStore.unselectAll();
        this.canvasStateStore.select(blockId);
        this.setMode({ type: "edit-text", blockId });
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
                    case "new-line":
                    case "new-shape":
                    case "new-text":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.setMode({ type: "select" });
                            this.canvasStateStore.selectAll();
                            return true;
                        } else {
                            this.setMode({ type: "new-line" });
                            this.appStateStore.setDefaultLineEnd(1, "none");
                            this.appStateStore.setDefaultLineEnd(2, "arrow");
                        }
                    }
                }
                break;
            }
            case "r": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-line":
                    case "new-text":
                    case "select": {
                        this.setMode({ type: "new-shape" });
                        return true;
                    }
                }
                break;
            }
            case "t": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-shape":
                    case "new-line":
                    case "select": {
                        this.setMode({ type: "new-text" });
                        return true;
                    }
                }
                break;
            }
            case "l": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-shape":
                    case "select": {
                        this.setMode({ type: "new-line" });
                        this.appStateStore.setDefaultLineEnd(1, "none");
                        this.appStateStore.setDefaultLineEnd(2, "none");
                        return true;
                    }
                }
                break;
            }
            case "z": {
                switch (this.appStateStore.getState().mode.type) {
                    case "new-line":
                    case "new-shape":
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
            case "edit-text": {
                const blockId = oldMode.blockId;
                const block =
                    this.canvasStateStore.getState().page.blocks[blockId];
                assert(block !== undefined, `Block ${blockId} is not found`);
                if (block.type === "text" && block.content === "") {
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

    setStrokeStyle(strokeStyle: StrokeStyle) {
        this.canvasStateStore.setStrokeStyle(strokeStyle);
        this.appStateStore.setDefaultStrokeStyle(strokeStyle);
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
