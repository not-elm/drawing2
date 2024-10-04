import { type Line, distanceFromPointToLine } from "../geo/Line";
import { distanceFromPointToPoint } from "../geo/Point";
import {
    isRectOverlapWithLine,
    isRectOverlapWithPoint,
    isRectOverlapWithRect,
} from "../geo/Rect";
import { getRectanglePath } from "../geo/path";
import type { StateProvider } from "../lib/Store";
import { assert } from "../lib/assert";
import { randomId } from "../lib/randomId";
import type { ColorId } from "../model/Colors";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import type { LineObject, Obj, PointObject, ShapeObject } from "../model/Page";
import type { TextAlignment } from "../model/TextAlignment";
import { Transaction } from "../model/Transaction";
import { AppStateStore } from "../store/AppStateStore";
import {
    CanvasStateStore,
    MouseButton,
    fromCanvasCoordinate,
} from "../store/CanvasStateStore";
import { HoverStateStore, testHitObjects } from "../store/HoverStateStore";
import { PointerStateStore } from "../store/PointerStateStore";
import { PropertyPanelStateStore } from "../store/PropertyPanelStateStore";
import { ViewportStore } from "../store/ViewportStore";
import {
    GestureRecognizer,
    type PointerEventSessionHandlers,
} from "./GestureRecognizer";
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
    readonly appStateStore = new AppStateStore(this.canvasStateStore);
    readonly propertyPanelStateStore = new PropertyPanelStateStore(
        this.canvasStateStore,
        this.appStateStore,
    );

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
        switch (ev.button) {
            case MouseButton.Left: {
                switch (this.appStateStore.getState().mode) {
                    case "select": {
                        const selectionRect = this.canvasStateStore
                            .getState()
                            .getSelectionRect();
                        const selectedObjects = this.canvasStateStore
                            .getState()
                            .getSelectedObjects();

                        // Selection
                        if (selectionRect !== null) {
                            const THRESHOLD = 32;

                            const isSingleLineMode =
                                selectedObjects.length === 1 &&
                                selectedObjects[0].type === "line";
                            if (isSingleLineMode) {
                                const line = selectedObjects[0] as LineObject;

                                if (
                                    distanceFromPointToPoint(
                                        { x: line.x1, y: line.y1 },
                                        { x, y },
                                    ) < THRESHOLD
                                ) {
                                    const originalPointId =
                                        this.canvasStateStore
                                            .getState()
                                            .page.dependencies.getByToObjectId(
                                                line.id,
                                            )
                                            .find(
                                                (dependency) =>
                                                    dependency.type ===
                                                        "lineEndPoint" &&
                                                    dependency.lineEnd === 1,
                                            )?.from;
                                    assert(
                                        originalPointId !== undefined,
                                        "LineEndPoint 1 is not found",
                                    );

                                    const originalPoint =
                                        this.canvasStateStore.getState().page
                                            .objects[originalPointId];
                                    assert(
                                        originalPoint !== undefined,
                                        `Point ${originalPointId} is not found`,
                                    );
                                    assert(
                                        originalPoint.type === "point",
                                        `Object ${originalPointId} is not a point`,
                                    );
                                    startSession(
                                        createMovePointSessionHandlers(
                                            originalPoint,
                                            this.canvasStateStore,
                                            this.viewportStore,
                                        ),
                                    );
                                    return;
                                }

                                if (
                                    distanceFromPointToPoint(
                                        { x: line.x2, y: line.y2 },
                                        { x, y },
                                    ) < THRESHOLD
                                ) {
                                    const originalPointId =
                                        this.canvasStateStore
                                            .getState()
                                            .page.dependencies.getByToObjectId(
                                                line.id,
                                            )
                                            .find(
                                                (dependency) =>
                                                    dependency.type ===
                                                        "lineEndPoint" &&
                                                    dependency.lineEnd === 2,
                                            )?.from;
                                    assert(
                                        originalPointId !== undefined,
                                        "LineEndPoint 2 is not found",
                                    );

                                    const originalPoint =
                                        this.canvasStateStore.getState().page
                                            .objects[originalPointId];
                                    assert(
                                        originalPoint !== undefined,
                                        `Point ${originalPointId} is not found`,
                                    );
                                    assert(
                                        originalPoint.type === "point",
                                        `Object ${originalPointId} is not a point`,
                                    );
                                    startSession(
                                        createMovePointSessionHandlers(
                                            originalPoint,
                                            this.canvasStateStore,
                                            this.viewportStore,
                                        ),
                                    );
                                    return;
                                }

                                if (
                                    distanceFromPointToLine({ x, y }, line)
                                        .distance < THRESHOLD
                                ) {
                                    startSession(
                                        createMoveSelectedObjectsSessionHandlers(
                                            x,
                                            y,
                                            ev.shiftKey,
                                            this.canvasStateStore,
                                            this.viewportStore,
                                        ),
                                    );
                                }
                            } else {
                                const topLeft = {
                                    x: selectionRect.x,
                                    y: selectionRect.y,
                                };
                                const topRight = {
                                    x: selectionRect.x + selectionRect.width,
                                    y: selectionRect.y,
                                };
                                const bottomLeft = {
                                    x: selectionRect.x,
                                    y: selectionRect.y + selectionRect.height,
                                };
                                const bottomRight = {
                                    x: selectionRect.x + selectionRect.width,
                                    y: selectionRect.y + selectionRect.height,
                                };

                                if (
                                    distanceFromPointToPoint(topLeft, {
                                        x,
                                        y,
                                    }) < THRESHOLD
                                ) {
                                    startSession(
                                        createXYResizeSessionHandlers(
                                            selectedObjects,
                                            bottomRight.x,
                                            bottomRight.y,
                                            this.canvasStateStore,
                                        ),
                                    );
                                    return;
                                }
                                if (
                                    distanceFromPointToPoint(topRight, {
                                        x,
                                        y,
                                    }) < THRESHOLD
                                ) {
                                    startSession(
                                        createXYResizeSessionHandlers(
                                            selectedObjects,
                                            bottomLeft.x,
                                            bottomLeft.y,
                                            this.canvasStateStore,
                                        ),
                                    );
                                    return;
                                }
                                if (
                                    distanceFromPointToPoint(bottomLeft, {
                                        x,
                                        y,
                                    }) < THRESHOLD
                                ) {
                                    startSession(
                                        createXYResizeSessionHandlers(
                                            selectedObjects,
                                            topRight.x,
                                            topRight.y,
                                            this.canvasStateStore,
                                        ),
                                    );
                                    return;
                                }
                                if (
                                    distanceFromPointToPoint(bottomRight, {
                                        x,
                                        y,
                                    }) < THRESHOLD
                                ) {
                                    startSession(
                                        createXYResizeSessionHandlers(
                                            selectedObjects,
                                            topLeft.x,
                                            topLeft.y,
                                            this.canvasStateStore,
                                        ),
                                    );
                                    return;
                                }

                                // Top, Bottom
                                {
                                    const top: Line = {
                                        x1: topLeft.x,
                                        y1: topLeft.y,
                                        x2: topRight.x,
                                        y2: topRight.y,
                                    };
                                    const bottom: Line = {
                                        x1: bottomLeft.x,
                                        y1: bottomLeft.y,
                                        x2: bottomRight.x,
                                        y2: bottomRight.y,
                                    };

                                    if (
                                        distanceFromPointToLine({ x, y }, top)
                                            .distance < THRESHOLD
                                    ) {
                                        startSession(
                                            createYResizeSessionHandlers(
                                                selectedObjects,
                                                bottom.y1,
                                                this.canvasStateStore,
                                            ),
                                        );
                                        return;
                                    }
                                    if (
                                        distanceFromPointToLine(
                                            { x, y },
                                            bottom,
                                        ).distance < THRESHOLD
                                    ) {
                                        startSession(
                                            createYResizeSessionHandlers(
                                                selectedObjects,
                                                top.y1,
                                                this.canvasStateStore,
                                            ),
                                        );
                                        return;
                                    }
                                }

                                // Left, Right
                                {
                                    const left: Line = {
                                        x1: topLeft.x,
                                        y1: topLeft.y,
                                        x2: bottomLeft.x,
                                        y2: bottomLeft.y,
                                    };
                                    const right: Line = {
                                        x1: topRight.x,
                                        y1: topRight.y,
                                        x2: bottomRight.x,
                                        y2: bottomRight.y,
                                    };
                                    if (
                                        distanceFromPointToLine({ x, y }, left)
                                            .distance < THRESHOLD
                                    ) {
                                        startSession(
                                            createXResizeSessionHandlers(
                                                selectedObjects,
                                                right.x1,
                                                this.canvasStateStore,
                                            ),
                                        );
                                        return;
                                    }
                                    if (
                                        distanceFromPointToLine({ x, y }, right)
                                            .distance < THRESHOLD
                                    ) {
                                        startSession(
                                            createXResizeSessionHandlers(
                                                selectedObjects,
                                                left.x1,
                                                this.canvasStateStore,
                                            ),
                                        );
                                        return;
                                    }
                                }

                                // Center
                                if (
                                    isRectOverlapWithPoint(selectionRect, {
                                        x,
                                        y,
                                    })
                                ) {
                                    startSession(
                                        createMoveSelectedObjectsSessionHandlers(
                                            x,
                                            y,
                                            ev.shiftKey,
                                            this.canvasStateStore,
                                            this.viewportStore,
                                        ),
                                    );
                                    return;
                                }
                            }
                        }

                        // Object
                        {
                            const hitResult = testHitObjects(
                                this.canvasStateStore.getState().page,
                                x,
                                y,
                                this.viewportStore.getState().scale,
                            );
                            if (hitResult.entries.length > 0) {
                                startSession(
                                    createMoveObjectSessionHandlers(
                                        hitResult.entries[0].object,
                                        ev.shiftKey,
                                        this.canvasStateStore,
                                    ),
                                );
                                return;
                            }
                        }

                        // Canvas
                        {
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
                    }
                    case "text": {
                        this.appStateStore.setMode("select");

                        // Object
                        {
                            const hitResult = testHitObjects(
                                this.canvasStateStore.getState().page,
                                x,
                                y,
                                this.viewportStore.getState().scale,
                            );
                            if (hitResult.entries.length > 0) {
                                this.canvasStateStore.unselectAll();
                                this.canvasStateStore.select(
                                    hitResult.entries[0].object.id,
                                );
                                startSession(
                                    createMoveObjectSessionHandlers(
                                        hitResult.entries[0].object,
                                        ev.shiftKey,
                                        this.canvasStateStore,
                                    ),
                                );
                                return;
                            }
                        }

                        // Canvas
                        {
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
                    }
                    case "line": {
                        startSession(
                            createNewLineSessionHandlers(
                                this.canvasStateStore,
                                this.viewportStore,
                                this.appStateStore,
                            ),
                        );
                        return;
                    }
                    case "shape": {
                        startSession(
                            createNewShapeSessionHandlers(
                                this.canvasStateStore,
                                this.appStateStore,
                            ),
                        );
                        return;
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
                this.appStateStore.setMode("text");
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
                switch (this.appStateStore.getState().mode) {
                    case "line":
                    case "shape":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            this.appStateStore.setMode("select");
                            this.canvasStateStore.selectAll();
                            return true;
                        }
                    }
                }
                break;
            }
            case "r": {
                switch (this.appStateStore.getState().mode) {
                    case "line":
                    case "select": {
                        this.appStateStore.setMode("shape");
                        return true;
                    }
                }
                break;
            }
            case "l": {
                switch (this.appStateStore.getState().mode) {
                    case "shape":
                    case "select": {
                        this.appStateStore.setMode("line");
                        return true;
                    }
                }
                break;
            }
            case "z": {
                switch (this.appStateStore.getState().mode) {
                    case "line":
                    case "shape":
                    case "select": {
                        if (modifiers.metaKey || modifiers.ctrlKey) {
                            if (modifiers.shiftKey) {
                                this.canvasStateStore.redo();
                            } else {
                                this.canvasStateStore.undo();
                            }
                            return true;
                        }
                    }
                }
                break;
            }
            case "x": {
                switch (this.appStateStore.getState().mode) {
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
                switch (this.appStateStore.getState().mode) {
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
                switch (this.appStateStore.getState().mode) {
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
                switch (this.appStateStore.getState().mode) {
                    case "select": {
                        this.canvasStateStore.unselectAll();
                        return true;
                    }
                    default: {
                        this.appStateStore.setMode("select");
                        return true;
                    }
                }
            }
            case "Delete":
            case "Backspace": {
                switch (this.appStateStore.getState().mode) {
                    case "select": {
                        this.canvasStateStore.deleteSelectedObjects();
                        return true;
                    }
                }
                break;
            }
        }

        return false;
    }

    handleModeChange(mode: Mode) {
        this.appStateStore.setMode(mode);
    }

    handleLabelChange(id: string, label: string) {
        this.canvasStateStore.setLabel(id, label);
    }

    handleTextAlignButtonClick(alignX: TextAlignment, alignY: TextAlignment) {
        this.canvasStateStore.setTextAlign(alignX, alignY);
        this.appStateStore.setDefaultTextAlign(alignX, alignY);
    }

    handleColorButtonClick(colorId: ColorId) {
        this.canvasStateStore.setColor(colorId);
        this.appStateStore.setDefaultColor(colorId);
    }

    handleFillModeButtonClick(fillMode: FillMode) {
        this.canvasStateStore.setFillMode(fillMode);
        this.appStateStore.setDefaultFillMode(fillMode);
    }

    handleBringToFrontButtonClick() {
        this.canvasStateStore.bringToFront();
    }

    handleBringForwardButtonClick() {
        this.canvasStateStore.bringForward();
    }

    handleSendBackwardButtonClick() {
        this.canvasStateStore.sendBackward();
    }

    handleSendToBackButtonClick() {
        this.canvasStateStore.sendToBack();
    }
}

function createNewLineSessionHandlers(
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

            let p1: PointObject;
            const nearestPoint1 = testHitObjects(
                page,
                data.startX,
                data.startY,
                scale,
            );

            if (nearestPoint1.entries.length === 0) {
                p1 = {
                    type: "point",
                    id: randomId(),
                    x: data.startX,
                    y: data.startY,
                };
                transaction.insertObjects([p1]);
            } else {
                const hitPointEntry = nearestPoint1.entries.find(
                    (entry) => entry.object.type === "point",
                );
                if (hitPointEntry) {
                    p1 = hitPointEntry.object as PointObject;
                } else {
                    const hitEntry = nearestPoint1.entries[0];
                    switch (hitEntry.object.type) {
                        case "point": {
                            assert(false, "unreachable");
                            break;
                        }
                        case "line": {
                            const width =
                                hitEntry.object.x2 - hitEntry.object.x1;
                            const height =
                                hitEntry.object.y2 - hitEntry.object.y1;
                            const relativePosition =
                                width > height
                                    ? (hitEntry.point.x - hitEntry.object.x1) /
                                      width
                                    : (hitEntry.point.y - hitEntry.object.y1) /
                                      height;
                            p1 = {
                                type: "point",
                                id: randomId(),
                                x: hitEntry.point.x,
                                y: hitEntry.point.y,
                            };
                            transaction.insertObjects([p1]).addDependency({
                                type: "pointOnLine",
                                id: randomId(),
                                from: hitEntry.object.id,
                                to: p1.id,
                                r: relativePosition,
                            });
                            break;
                        }
                        case "shape": {
                            const rx =
                                (hitEntry.point.x - hitEntry.object.x) /
                                hitEntry.object.width;
                            const ry =
                                (hitEntry.point.y - hitEntry.object.y) /
                                hitEntry.object.height;
                            p1 = {
                                type: "point",
                                id: randomId(),
                                x: hitEntry.point.x,
                                y: hitEntry.point.y,
                            };
                            transaction.insertObjects([p1]).addDependency({
                                type: "pointOnShape",
                                id: randomId(),
                                from: hitEntry.object.id,
                                to: p1.id,
                                rx,
                                ry,
                            });
                        }
                    }
                }
            }

            let p2: PointObject;
            const nearestPoint2 = testHitObjects(
                page,
                data.newX,
                data.newY,
                scale,
            );

            if (nearestPoint2.entries.length === 0) {
                p2 = {
                    type: "point",
                    id: randomId(),
                    x: data.newX,
                    y: data.newY,
                };
                transaction.insertObjects([p2]);
            } else {
                const hitPointEntry = nearestPoint2.entries.find(
                    (entry) => entry.object.type === "point",
                );
                if (hitPointEntry) {
                    p2 = hitPointEntry.object as PointObject;
                } else {
                    const hitEntry = nearestPoint2.entries[0];
                    switch (hitEntry.object.type) {
                        case "point": {
                            assert(false, "unreachable");
                            break;
                        }
                        case "line": {
                            const width =
                                hitEntry.object.x2 - hitEntry.object.x1;
                            const height =
                                hitEntry.object.y2 - hitEntry.object.y1;
                            const relativePosition =
                                width > height
                                    ? (hitEntry.point.x - hitEntry.object.x1) /
                                      width
                                    : (hitEntry.point.y - hitEntry.object.y1) /
                                      height;
                            p2 = {
                                type: "point",
                                id: randomId(),
                                x: hitEntry.point.x,
                                y: hitEntry.point.y,
                            };
                            transaction.insertObjects([p2]).addDependency({
                                type: "pointOnLine",
                                id: randomId(),
                                from: hitEntry.object.id,
                                to: p2.id,
                                r: relativePosition,
                            });
                            break;
                        }
                        case "shape": {
                            const rx =
                                (hitEntry.point.x - hitEntry.object.x) /
                                hitEntry.object.width;
                            const ry =
                                (hitEntry.point.y - hitEntry.object.y) /
                                hitEntry.object.height;
                            p2 = {
                                type: "point",
                                id: randomId(),
                                x: hitEntry.point.x,
                                y: hitEntry.point.y,
                            };
                            transaction.insertObjects([p2]).addDependency({
                                type: "pointOnShape",
                                id: randomId(),
                                from: hitEntry.object.id,
                                to: p2.id,
                                rx,
                                ry,
                            });
                        }
                    }
                }
            }

            const line: LineObject = {
                id: randomId(),
                type: "line",
                x1: p1.x,
                y1: p1.y,
                x2: p2.x,
                y2: p2.y,
                colorId: appStateStore.getState().defaultColorId,
            };
            transaction
                .insertObjects([line])
                .addDependency({
                    id: randomId(),
                    type: "lineEndPoint",
                    lineEnd: 1,
                    from: p1.id,
                    to: line.id,
                })
                .addDependency({
                    id: randomId(),
                    type: "lineEndPoint",
                    lineEnd: 2,
                    from: p2.id,
                    to: line.id,
                });

            canvasStateStore.setPage(transaction.commit());
            appStateStore.setMode("select");
            canvasStateStore.unselectAll();
            canvasStateStore.select(line.id);
        },
    };
}

function createNewShapeSessionHandlers(
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
            const shape: ShapeObject = {
                type: "shape",
                id: randomId(),
                x,
                y,
                width,
                height,
                label: "",
                textAlignX: appStateStore.getState().defaultTextAlignX,
                textAlignY: appStateStore.getState().defaultTextAlignY,
                colorId: appStateStore.getState().defaultColorId,
                fillMode: appStateStore.getState().defaultFillMode,
                path: getRectanglePath(),
            };
            canvasStateStore.addObjects(shape);
            appStateStore.setMode("select");
            canvasStateStore.unselectAll();
            canvasStateStore.select(shape.id);
        },
    };
}

function createMoveSelectedObjectsSessionHandlers(
    x: number,
    y: number,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
    viewportStore: ViewportStore,
): PointerEventSessionHandlers {
    const hitResult = testHitObjects(
        canvasStateStore.getState().page,
        x,
        y,
        viewportStore.getState().scale,
    );
    const selectedObjects = canvasStateStore.getState().getSelectedObjects();
    return {
        type: "move",
        onPointerMove: (data) => {
            canvasStateStore.resetAndMoveObjects(
                selectedObjects,
                data.newX - data.startX,
                data.newY - data.startY,
            );
        },
        onClick: () => {
            if (hitResult.entries.length > 0) {
                if (shiftKey) {
                    canvasStateStore.toggleSelect(
                        hitResult.entries[0].object.id,
                    );
                } else {
                    canvasStateStore.unselectAll();
                    canvasStateStore.select(hitResult.entries[0].object.id);
                }
            }
        },
    };
}

function createMoveObjectSessionHandlers(
    object: Obj,
    shiftKey: boolean,
    canvasStateStore: CanvasStateStore,
): PointerEventSessionHandlers {
    if (!shiftKey) {
        canvasStateStore.unselectAll();
    }
    canvasStateStore.select(object.id);

    const selectedObjects = canvasStateStore.getState().getSelectedObjects();

    return {
        type: "move",
        onPointerMove: (data) => {
            canvasStateStore.resetAndMoveObjects(
                selectedObjects,
                data.newX - data.startX,
                data.newY - data.startY,
            );
        },
    };
}

function createMovePointSessionHandlers(
    originalPoint: PointObject,
    canvasStateStore: CanvasStateStore,
    viewportProvider: StateProvider<ViewportStore>,
): PointerEventSessionHandlers {
    const ignoreObjectIds = new Set([originalPoint.id]);
    const connectedLineIds = canvasStateStore
        .getState()
        .page.dependencies.getByFromObjectId(originalPoint.id)
        .map((dep) => dep.to);
    for (const lineId of connectedLineIds) {
        ignoreObjectIds.add(lineId);
    }

    const dependenciesToPoint = canvasStateStore
        .getState()
        .page.dependencies.getByToObjectId(originalPoint.id)
        .filter(
            (dep) => dep.type === "pointOnShape" || dep.type === "pointOnLine",
        );

    return {
        type: "move-point",
        onPointerMove: (data) => {
            const nearestPoint = testHitObjects(
                canvasStateStore.getState().page,
                data.newX,
                data.newY,
                viewportProvider.getState().scale,
            );

            const hitEntries = nearestPoint.entries.filter(
                (item) => !ignoreObjectIds.has(item.object.id),
            );

            const hitPointEntry = hitEntries.find(
                (entry) => entry.object.type === "point",
            );
            const hitEntry = hitPointEntry ?? hitEntries[0];

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

            const nearestPoint = testHitObjects(
                canvasStateStore.getState().page,
                data.newX,
                data.newY,
                viewportProvider.getState().scale,
            );

            const hitEntries = nearestPoint.entries.filter(
                (item) => !ignoreObjectIds.has(item.object.id),
            );

            const hitPointEntry = hitEntries.find(
                (entry) => entry.object.type === "point",
            );
            if (hitPointEntry !== undefined) {
                transaction.mergePoints(
                    originalPoint.id,
                    hitPointEntry.object.id,
                );
            } else {
                const hitEntry = hitEntries[0];
                switch (hitEntry?.object.type) {
                    case "point": {
                        assert(false, "unreachable");
                        break;
                    }
                    case "line": {
                        const width = hitEntry.object.x2 - hitEntry.object.x1;
                        const height = hitEntry.object.y2 - hitEntry.object.y1;

                        const r =
                            width > height
                                ? (hitEntry.point.x - hitEntry.object.x1) /
                                  width
                                : (hitEntry.point.y - hitEntry.object.y1) /
                                  height;

                        transaction.addDependency({
                            id: randomId(),
                            type: "pointOnLine",
                            from: hitEntry.object.id,
                            to: originalPoint.id,
                            r: r,
                        });
                        break;
                    }
                    case "shape": {
                        const rx =
                            (hitEntry.point.x - hitEntry.object.x) /
                            hitEntry.object.width;
                        const ry =
                            (hitEntry.point.y - hitEntry.object.y) /
                            hitEntry.object.height;

                        transaction.addDependency({
                            id: randomId(),
                            type: "pointOnShape",
                            from: hitEntry.object.id,
                            to: originalPoint.id,
                            rx,
                            ry,
                        });
                        break;
                    }
                }
            }

            canvasStateStore.setPage(transaction.commit());
        },
    };
}

function createSelectByRangeSessionHandlers(
    canvasStateStore: CanvasStateStore,
): PointerEventSessionHandlers {
    const originalSelectedObjectIds =
        canvasStateStore.getState().selectedObjectIds;

    return {
        type: "selector",
        onPointerMove: (data) => {
            const selectionRect = {
                x: Math.min(data.startX, data.newX),
                y: Math.min(data.startY, data.newY),
                width: Math.abs(data.newX - data.startX),
                height: Math.abs(data.newY - data.startY),
            };
            const selectedObjectIds = new Set(originalSelectedObjectIds);

            for (const obj of Object.values(
                canvasStateStore.getState().page.objects,
            )) {
                switch (obj.type) {
                    case "shape": {
                        if (isRectOverlapWithRect(selectionRect, obj)) {
                            selectedObjectIds.add(obj.id);
                        }
                        break;
                    }
                    case "line": {
                        if (isRectOverlapWithLine(selectionRect, obj)) {
                            selectedObjectIds.add(obj.id);
                        }
                        break;
                    }
                    case "point": {
                        if (isRectOverlapWithPoint(selectionRect, obj)) {
                            selectedObjectIds.add(obj.id);
                        }
                        break;
                    }
                }
            }

            canvasStateStore.setSelectedObjectIds([...selectedObjectIds]);
        },
    };
}

function createXYResizeSessionHandlers(
    originalObjects: Obj[],
    originX: number,
    originY: number,
    canvasStateStore: CanvasStateStore,
): PointerEventSessionHandlers {
    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.resetAndScaleObjects(
                originalObjects,
                (data.newX - originX) / (data.startX - originX),
                (data.newY - originY) / (data.startY - originY),
                originX,
                originY,
            );
        },
    };
}

function createXResizeSessionHandlers(
    originalObjects: Obj[],
    originX: number,
    canvasStateStore: CanvasStateStore,
): PointerEventSessionHandlers {
    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.resetAndScaleObjects(
                originalObjects,
                (data.newX - originX) / (data.startX - originX),
                1,
                originX,
                0,
            );
        },
    };
}

function createYResizeSessionHandlers(
    originalObjects: Obj[],
    originY: number,
    canvasStateStore: CanvasStateStore,
): PointerEventSessionHandlers {
    return {
        type: "resize",
        onPointerMove: (data) => {
            canvasStateStore.resetAndScaleObjects(
                originalObjects,
                1,
                (data.newY - originY) / (data.startY - originY),
                0,
                originY,
            );
        },
    };
}
