import { isLineOverlapWithLine, isLineOverlapWithPoint } from "../geo/Line";
import {
    isRectOverlapWithLine,
    isRectOverlapWithPoint,
    isRectOverlapWithRect,
} from "../geo/Rect";
import { getRectanglePath } from "../geo/path";
import { type StateProvider, Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { isNotNullish } from "../lib/isNullish";
import { randomId } from "../lib/randomId";
import { CanvasState } from "../model/CanvasState";
import type { ColorId } from "../model/Colors";
import { DependencyCollection } from "../model/DependencyCollection";
import type { FillMode } from "../model/FillMode";
import type { Mode } from "../model/Mode";
import type { LineObject, Obj, PointObject, ShapeObject } from "../model/Page";
import type { TextAlignment } from "../model/TextAlignment";
import { Transaction } from "../model/Transaction";
import type { Viewport } from "../model/Viewport";
import { getNearestPoint } from "./HoverStateStore";
import type { ViewportStore } from "./ViewportStore";

export class CanvasStateStore extends Store<CanvasState> {
    private viewportProvider: StateProvider<ViewportStore> | null = null;

    constructor() {
        super(
            new CanvasState({
                page: {
                    objects: {},
                    objectIds: [],
                    dependencies: new DependencyCollection(),
                },
                mode: "select",
                selectedObjectIds: [],
                dragType: { type: "none" },
                dragging: false,
                dragStartX: 0,
                dragStartY: 0,
                dragCurrentX: 0,
                dragCurrentY: 0,
                defaultColorId: 0,
                defaultFillMode: "mono",
                defaultTextAlignX: "center",
                defaultTextAlignY: "center",
            }),
        );

        // this.loadFromLocalStorage();
        //
        // setInterval(() => {
        // 	this.saveToLocalStorage();
        // }, 1000);
    }

    setViewportProvider(provider: StateProvider<ViewportStore>) {
        this.viewportProvider = provider;
    }

    addObjects(...objects: Obj[]) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .insertObjects(objects)
                    .commit(),
            ),
        );
    }

    deleteObject(ids: string[]) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page).deleteObjects(ids).commit(),
            ),
        );
    }

    deleteSelectedObjects() {
        this.deleteObject(this.state.selectedObjectIds);
    }

    updateZIndex(currentIndex: number, newIndex: number) {
        const newObjectIds = this.state.page.objectIds.slice();
        const [id] = newObjectIds.splice(currentIndex, 1);
        newObjectIds.splice(newIndex, 0, id);

        this.setState(
            this.state.setPage({
                ...this.state.page,
                objectIds: newObjectIds,
            }),
        );
    }

    // Command or Pageをスタックで管理
    undo() {}

    redo() {}

    resetAndMoveObjects(objects: Obj[], deltaX: number, deltaY: number) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .replaceObjects(objects)
                    .moveObjects(
                        objects.map((obj) => obj.id),
                        deltaX,
                        deltaY,
                    )
                    .commit(),
            ),
        );
    }

    resetAndScaleObjects(
        objects: Obj[],
        scaleX: number,
        scaleY: number,
        originX: number,
        originY: number,
    ) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .replaceObjects(objects)
                    .scaleObjects(
                        objects.map((obj) => obj.id),
                        originX,
                        originY,
                        scaleX,
                        scaleY,
                    )
                    .commit(),
            ),
        );
    }

    mergePoints(fromId: string, toId: string) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .mergePoints(fromId, toId)
                    .commit(),
            ),
        );
    }

    setLabel(id: string, label: string) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty([id], (oldObject) => {
                        assert(
                            oldObject.type === "shape",
                            `Invalid object type: ${oldObject.id} ${oldObject.type}`,
                        );
                        return { ...oldObject, label };
                    })
                    .commit(),
            ),
        );
    }

    setTextAlign(textAlignX: TextAlignment, textAlignY: TextAlignment) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedObjectIds,
                        (oldObject) => {
                            switch (oldObject.type) {
                                case "shape": {
                                    return {
                                        ...oldObject,
                                        textAlignX,
                                        textAlignY,
                                    };
                                }
                                default: {
                                    return oldObject;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    setColor(colorId: ColorId) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedObjectIds,
                        (oldObject) => {
                            switch (oldObject.type) {
                                case "shape":
                                case "line": {
                                    return { ...oldObject, colorId };
                                }
                                default: {
                                    return oldObject;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    setFillMode(fillMode: FillMode) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedObjectIds,
                        (oldObject) => {
                            switch (oldObject.type) {
                                case "shape": {
                                    return { ...oldObject, fillMode };
                                }
                                default: {
                                    return oldObject;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    bringToFront() {
        this.bringForwardOf(this.state.page.objectIds.length - 1);
    }

    bringForward() {
        const selectedIdSet = new Set(this.state.selectedObjectIds);

        let mostBackwardResult = null;
        for (const selectedId of selectedIdSet) {
            const result = this.findForwardOverlappedObject(
                selectedId,
                selectedIdSet,
            );
            if (result === null) continue;
            if (mostBackwardResult === null) {
                mostBackwardResult = result;
            } else {
                if (result.globalIndex < mostBackwardResult.globalIndex) {
                    mostBackwardResult = result;
                }
            }
        }
        if (mostBackwardResult === null) {
            // selected objects are already at the front
            return;
        }

        this.bringForwardOf(mostBackwardResult.globalIndex + 1);
    }

    sendToBack() {
        this.sendBackwardOf(0);
    }

    sendBackward() {
        const selectedIdSet = new Set(this.state.selectedObjectIds);

        let mostForwardResult = null;
        for (const selectedId of selectedIdSet) {
            const result = this.findBackwardOverlappedObject(
                selectedId,
                selectedIdSet,
            );
            if (result === null) continue;
            if (mostForwardResult === null) {
                mostForwardResult = result;
            } else {
                if (result.globalIndex > mostForwardResult.globalIndex) {
                    mostForwardResult = result;
                }
            }
        }
        if (mostForwardResult === null) {
            // selected objects are already at the front
            return;
        }

        this.sendBackwardOf(mostForwardResult.globalIndex);
    }

    /**
     * Update the z-index of the selected objects to bring them
     * forward of the target object
     * @param targetObjectZIndex
     */
    private bringForwardOf(targetObjectZIndex: number) {
        const selectedIdSet = new Set(this.state.selectedObjectIds);

        // Current z-index of selected objects
        const currentIndices = [];
        for (let i = 0; i < this.state.page.objectIds.length; i++) {
            if (selectedIdSet.has(this.state.page.objectIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices.toReversed()) {
            if (currentIndex >= targetObjectZIndex) continue;

            this.updateZIndex(currentIndex, targetObjectZIndex);
            targetObjectZIndex -= 1;
        }
    }

    /**
     * Update the z-index of the selected objects to send them
     * backward of the target object
     * @param targetObjectZIndex
     */
    private sendBackwardOf(targetObjectZIndex: number) {
        const selectedIdSet = new Set(this.state.selectedObjectIds);

        // Current z-index of selected objects
        const currentIndices = [];
        for (let i = 0; i < this.state.page.objectIds.length; i++) {
            if (selectedIdSet.has(this.state.page.objectIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices) {
            if (currentIndex <= targetObjectZIndex) continue;

            this.updateZIndex(currentIndex, targetObjectZIndex);
            targetObjectZIndex += 1;
        }
    }

    /**
     * Find the overlapped object with the given object from the objects
     * located in front of it, and return the most-backward object.
     */
    private findForwardOverlappedObject(
        objectId: string,
        ignoreObjectIds: Set<string>,
    ): { objectId: string; globalIndex: number } | null {
        let globalIndex = 0;
        for (; globalIndex < this.state.page.objectIds.length; globalIndex++) {
            if (this.state.page.objectIds[globalIndex] === objectId) break;
        }

        const refObject = this.state.page.objects[objectId];
        assert(refObject !== undefined, "Cannot find the reference object");
        globalIndex++;

        for (; globalIndex < this.state.page.objectIds.length; globalIndex++) {
            const objectId = this.state.page.objectIds[globalIndex];
            if (ignoreObjectIds.has(objectId)) {
                continue;
            }

            const otherObject = this.state.page.objects[objectId];

            if (otherObject === undefined) continue;

            if (isOverlapped(refObject, otherObject)) {
                return { objectId, globalIndex };
            }
        }

        return null;
    }

    /**
     * Find the overlapped object with the given object from the objects
     * located behind of it, and return the most-forward object.
     */
    private findBackwardOverlappedObject(
        objectId: string,
        ignoreObjectIds: Set<string>,
    ): { objectId: string; globalIndex: number } | null {
        let globalIndex = this.state.page.objectIds.length - 1;
        for (; globalIndex >= 0; globalIndex--) {
            if (this.state.page.objectIds[globalIndex] === objectId) break;
        }

        const refObject = this.state.page.objects[objectId];
        assert(refObject !== undefined, "Cannot find the reference object");
        globalIndex--;

        for (; globalIndex >= 0; globalIndex--) {
            const objectId = this.state.page.objectIds[globalIndex];
            if (ignoreObjectIds.has(objectId)) {
                continue;
            }

            const otherObject = this.state.page.objects[objectId];

            if (otherObject === undefined) continue;

            if (isOverlapped(refObject, otherObject)) {
                return { objectId, globalIndex };
            }
        }

        return null;
    }

    setMode(mode: Mode) {
        if (this.state.dragging) {
            this.endDrag();
        }

        this.setState(this.state.copy({ mode }));

        if (mode !== "select" && mode !== "text") {
            this.unselectAll();
        }
    }

    select(id: string) {
        this.setState(this.state.select(id));
    }

    selectAll() {
        this.setState(this.state.selectAll());
    }

    unselect(id: string) {
        this.setState(this.state.unselect(id));
    }

    unselectAll() {
        this.setState(this.state.unselectAll());
    }

    toggleSelect(id: string) {
        if (this.state.selectedObjectIds.includes(id)) {
            this.unselect(id);
        } else {
            this.select(id);
        }
    }

    private setSelectedObjectIds(ids: string[]) {
        this.setState(this.state.setSelectedObjectIds(ids));
    }

    copy() {
        // if (this.state.selectedObjectIds.length === 0) return;
        //
        // const objects = this.state.getSelectedObjects();
        //
        // ClipboardService.copy(objects);
    }

    async cut() {
        this.copy();
        this.deleteSelectedObjects();
    }

    async paste(): Promise<void> {
        // const { objects, points } = await ClipboardService.paste();
        //
        // this.addPoints(...points);
        // this.addObjects(...objects);
        //
        // this.setSelectedObjectIds(objects.map((obj) => obj.id));
    }

    startDrag(startCanvasX: number, startCanvasY: number, type: DragType) {
        assert(
            !this.getState().dragging,
            "Cannot start dragging while dragging",
        );

        const [startX, startY] = fromCanvasCoordinate(
            startCanvasX,
            startCanvasY,
            this.viewportProvider?.getState() ?? { x: 0, y: 0, scale: 1 },
        );

        this.setState(
            this.getState().copy({
                dragType: type,
                dragging: true,
                dragStartX: startX,
                dragStartY: startY,
                dragCurrentX: startX,
                dragCurrentY: startY,
            }),
        );
    }

    updateDrag(currentCanvasX: number, currentCanvasY: number) {
        assert(this.getState().dragging, "Cannot move drag while not dragging");

        const [currentX, currentY] = fromCanvasCoordinate(
            currentCanvasX,
            currentCanvasY,
            this.viewportProvider?.getState() ?? { x: 0, y: 0, scale: 1 },
        );

        this.setState(
            this.getState().copy({
                dragCurrentX: currentX,
                dragCurrentY: currentY,
            }),
        );

        switch (this.state.mode) {
            case "select": {
                switch (this.state.dragType.type) {
                    case "select": {
                        const selectionRect = this.state.getSelectorRect();
                        assert(
                            selectionRect !== null,
                            "Cannot select without a selection",
                        );
                        const selectedObjectIds =
                            this.state.dragType.originalSelectedObjectIds.slice();

                        for (const obj of Object.values(
                            this.state.page.objects,
                        )) {
                            switch (obj.type) {
                                case "shape": {
                                    if (
                                        isRectOverlapWithRect(
                                            selectionRect,
                                            obj,
                                        )
                                    ) {
                                        selectedObjectIds.push(obj.id);
                                    }
                                    break;
                                }
                                case "line": {
                                    if (
                                        isRectOverlapWithLine(
                                            selectionRect,
                                            obj,
                                        )
                                    ) {
                                        selectedObjectIds.push(obj.id);
                                    }
                                    break;
                                }
                                case "point": {
                                    if (
                                        isRectOverlapWithPoint(
                                            selectionRect,
                                            obj,
                                        )
                                    ) {
                                        selectedObjectIds.push(obj.id);
                                    }
                                    break;
                                }
                            }
                        }
                        this.setSelectedObjectIds(selectedObjectIds);
                        break;
                    }
                    case "move": {
                        this.resetAndMoveObjects(
                            this.state.dragType.originalObjects,
                            this.state.dragCurrentX - this.state.dragStartX,
                            this.state.dragCurrentY - this.state.dragStartY,
                        );
                        break;
                    }
                    case "move-point": {
                        const { originalPoint } = this.state.dragType;
                        const nearestPoint = getNearestPoint(
                            this.state.page,
                            this.state.dragCurrentX,
                            this.state.dragCurrentY,
                            this.viewportProvider?.getState()?.scale ?? 1,
                            [originalPoint.id],
                        );

                        const x =
                            nearestPoint?.x ??
                            originalPoint.x +
                                (this.state.dragCurrentX -
                                    this.state.dragStartX);
                        const y =
                            nearestPoint?.y ??
                            originalPoint.y +
                                (this.state.dragCurrentY -
                                    this.state.dragStartY);

                        this.setState(
                            this.state.setPage(
                                new Transaction(this.state.page)
                                    .setPointPosition(originalPoint.id, x, y)
                                    .commit(),
                            ),
                        );
                        break;
                    }
                    case "nwse-resize":
                    case "nesw-resize": {
                        this.resetAndScaleObjects(
                            this.state.dragType.originalObjects,
                            (this.state.dragCurrentX -
                                this.state.dragType.originX) /
                                (this.state.dragStartX -
                                    this.state.dragType.originX),
                            (this.state.dragCurrentY -
                                this.state.dragType.originY) /
                                (this.state.dragStartY -
                                    this.state.dragType.originY),
                            this.state.dragType.originX,
                            this.state.dragType.originY,
                        );
                        break;
                    }
                    case "ns-resize": {
                        this.resetAndScaleObjects(
                            this.state.dragType.originalObjects,
                            1,
                            (this.state.dragCurrentY -
                                this.state.dragType.originY) /
                                (this.state.dragStartY -
                                    this.state.dragType.originY),
                            0,
                            this.state.dragType.originY,
                        );
                        break;
                    }
                    case "ew-resize": {
                        this.resetAndScaleObjects(
                            this.state.dragType.originalObjects,
                            (this.state.dragCurrentX -
                                this.state.dragType.originX) /
                                (this.state.dragStartX -
                                    this.state.dragType.originX),
                            1,
                            this.state.dragType.originX,
                            0,
                        );
                        break;
                    }
                }
                break;
            }
        }
    }

    endDrag() {
        assert(this.state.dragging, "Cannot end drag while not dragging");
        const dragType = this.state.dragType;

        this.setState(
            this.state.copy({
                dragging: false,
                dragType: { type: "none" },
            }),
        );

        switch (this.state.mode) {
            case "select": {
                switch (dragType.type) {
                    case "move-point": {
                        const { originalPoint } = dragType;
                        const transaction = new Transaction(this.state.page);

                        const nearestPoint = getNearestPoint(
                            this.state.page,
                            this.state.dragCurrentX,
                            this.state.dragCurrentY,
                            this.viewportProvider?.getState()?.scale ?? 1,
                            [originalPoint.id],
                        );

                        if (isNotNullish(nearestPoint?.pointId)) {
                            transaction.mergePoints(
                                originalPoint.id,
                                nearestPoint.pointId,
                            );
                        } else if (isNotNullish(nearestPoint?.lineId)) {
                            const line =
                                this.state.page.objects[nearestPoint.lineId];
                            assert(
                                line !== undefined,
                                `Line not found: ${nearestPoint.lineId}`,
                            );
                            assert(
                                line.type === "line",
                                "Parent is not a line",
                            );

                            const width = line.x2 - line.x1;
                            const height = line.y2 - line.y1;

                            const relativePosition =
                                width > height
                                    ? (nearestPoint.x - line.x1) / width
                                    : (nearestPoint.y - line.y1) / height;

                            transaction.addDependency({
                                id: line.id,
                                type: "pointOnLine",
                                from: nearestPoint.lineId,
                                to: originalPoint.id,
                                r: relativePosition,
                            });
                        }

                        this.setState(this.state.setPage(transaction.commit()));
                        break;
                    }
                }
                break;
            }
            case "shape": {
                const width = Math.abs(
                    this.state.dragCurrentX - this.state.dragStartX,
                );
                const height = Math.abs(
                    this.state.dragCurrentY - this.state.dragStartY,
                );
                if (width === 0 || height === 0) break;

                const x = Math.min(
                    this.state.dragStartX,
                    this.state.dragCurrentX,
                );
                const y = Math.min(
                    this.state.dragStartY,
                    this.state.dragCurrentY,
                );
                const shape: ShapeObject = {
                    type: "shape",
                    id: randomId(),
                    x,
                    y,
                    width,
                    height,
                    label: "",
                    textAlignX: this.state.defaultTextAlignX,
                    textAlignY: this.state.defaultTextAlignY,
                    colorId: this.state.defaultColorId,
                    fillMode: this.state.defaultFillMode,
                    path: getRectanglePath(),
                };
                this.addObjects(shape);
                this.setMode("select");
                this.select(shape.id);
                break;
            }
            case "line": {
                assert(dragType.type === "new-line", "Invalid drag type");

                const transaction = new Transaction(this.state.page);

                let p1: PointObject;
                const nearestPoint1 = getNearestPoint(
                    this.state.page,
                    this.state.dragStartX,
                    this.state.dragStartY,
                    this.viewportProvider?.getState()?.scale ?? 1,
                    [],
                );

                if (isNotNullish(nearestPoint1?.pointId)) {
                    const _p1 = this.state.page.objects[nearestPoint1.pointId];
                    assert(
                        _p1 !== undefined,
                        `Cannot find the highlighted point(${nearestPoint1.pointId})`,
                    );
                    assert(
                        _p1.type === "point",
                        `Invalid object type: ${_p1.id} ${_p1.type}`,
                    );
                    p1 = _p1;
                } else if (isNotNullish(nearestPoint1?.lineId)) {
                    const parentLine =
                        this.state.page.objects[nearestPoint1.lineId];
                    assert(
                        parentLine !== undefined,
                        `Line not found: ${nearestPoint1.lineId}`,
                    );
                    assert(parentLine.type === "line", "Parent is not a line");

                    const width = parentLine.x2 - parentLine.x1;
                    const height = parentLine.y2 - parentLine.y1;
                    const relativePosition =
                        width > height
                            ? (nearestPoint1.x - parentLine.x1) / width
                            : (nearestPoint1.y - parentLine.y1) / height;
                    p1 = {
                        type: "point",
                        id: randomId(),
                        x: nearestPoint1.x,
                        y: nearestPoint1.y,
                    };
                    transaction.insertObjects([p1]).addDependency({
                        type: "pointOnLine",
                        id: randomId(),
                        from: nearestPoint1.lineId,
                        to: p1.id,
                        r: relativePosition,
                    });
                } else {
                    p1 = {
                        type: "point",
                        id: randomId(),
                        x: this.state.dragStartX,
                        y: this.state.dragStartY,
                    };
                    transaction.insertObjects([p1]);
                }

                let p2: PointObject;
                const nearestPoint2 = getNearestPoint(
                    this.state.page,
                    this.state.dragCurrentX,
                    this.state.dragCurrentY,
                    this.viewportProvider?.getState()?.scale ?? 1,
                    [],
                );

                if (isNotNullish(nearestPoint2?.pointId)) {
                    const _p2 = this.state.page.objects[nearestPoint2.pointId];
                    assert(
                        _p2 !== undefined,
                        `Cannot find the highlighted point(${nearestPoint2.pointId})`,
                    );
                    assert(
                        _p2.type === "point",
                        `Invalid object type: ${_p2.id} ${_p2.type}`,
                    );
                    p2 = _p2;
                } else if (isNotNullish(nearestPoint2?.lineId)) {
                    const parentLine =
                        this.state.page.objects[nearestPoint2.lineId];
                    assert(
                        parentLine !== undefined,
                        `Line not found: ${nearestPoint2.lineId}`,
                    );
                    assert(parentLine.type === "line", "Parent is not a line");

                    const width = parentLine.x2 - parentLine.x1;
                    const height = parentLine.y2 - parentLine.y1;
                    const relativePosition =
                        width > height
                            ? (nearestPoint2.x - parentLine.x1) / width
                            : (nearestPoint2.y - parentLine.y1) / height;
                    p2 = {
                        type: "point",
                        id: randomId(),
                        x: nearestPoint2.x,
                        y: nearestPoint2.y,
                    };
                    transaction.insertObjects([p2]).addDependency({
                        type: "pointOnLine",
                        id: randomId(),
                        from: nearestPoint2.lineId,
                        to: p2.id,
                        r: relativePosition,
                    });
                } else {
                    p2 = {
                        type: "point",
                        id: randomId(),
                        x: this.state.dragCurrentX,
                        y: this.state.dragCurrentY,
                    };
                    transaction.insertObjects([p2]);
                }

                const line: LineObject = {
                    id: randomId(),
                    type: "line",
                    x1: p1.x,
                    y1: p1.y,
                    x2: p2.x,
                    y2: p2.y,
                    colorId: this.state.defaultColorId,
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

                this.setState(this.state.setPage(transaction.commit()));
                this.setMode("select");
                this.select(line.id);
            }
        }
    }

    // private saveToLocalStorage() {
    // 	const serializedPage = serializePage(this.state.page);
    //
    // 	localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializedPage));
    // }
    //
    // private loadFromLocalStorage() {
    // 	try {
    // 		const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    // 		if (data === null) return;
    //
    // 		const serializedPage: SerializedPage = JSON.parse(data);
    // 		const page = deserializePage(serializedPage);
    //
    // 		this.setState(
    // 			this.state.setPage(page).copy({
    // 				selectedObjectIds: [],
    // 			}),
    // 		);
    // 	} catch {}
    // }
}

export type SelectionRectHandleType =
    | "center"
    | "topLeft"
    | "top"
    | "topRight"
    | "right"
    | "bottomRight"
    | "bottom"
    | "bottomLeft"
    | "left";

export const MouseButton = {
    Left: 0,
    Middle: 1,
    Right: 2,
};

export type DragType =
    | { type: "none" }
    | { type: "new-line" }
    | { type: "select"; originalSelectedObjectIds: string[] }
    | {
          type: "move"; // moving multiple objects
          originalObjects: Obj[];
      }
    | {
          type: "move-point"; // moving a point in a path
          originalPoint: PointObject;
      }
    | {
          type: "nwse-resize";
          originX: number;
          originY: number;
          originalObjects: Obj[];
      }
    | {
          type: "nesw-resize";
          originX: number;
          originY: number;
          originalObjects: Obj[];
      }
    | {
          type: "ns-resize";
          originY: number;
          originalObjects: Obj[];
      }
    | {
          type: "ew-resize";
          originX: number;
          originalObjects: Obj[];
      };

export function fromCanvasCoordinate(
    canvasX: number,
    canvasY: number,
    viewport: Viewport,
): [x: number, y: number] {
    return [
        canvasX / viewport.scale + viewport.x,
        canvasY / viewport.scale + viewport.y,
    ];
}

export function isOverlapped(obj1: Obj, obj2: Obj): boolean {
    switch (obj1.type) {
        case "shape": {
            switch (obj2.type) {
                case "shape": {
                    return isRectOverlapWithRect(obj1, obj2);
                }
                case "line": {
                    return isRectOverlapWithLine(obj1, obj2);
                }
                case "point": {
                    return isRectOverlapWithPoint(obj1, obj2);
                }
            }
            break;
        }
        case "line": {
            switch (obj2.type) {
                case "shape": {
                    return isOverlapped(obj2, obj1);
                }
                case "line": {
                    return isLineOverlapWithLine(obj1, obj2);
                }
                case "point": {
                    return isLineOverlapWithPoint(obj1, obj2);
                }
            }
            break;
        }
        case "point": {
            switch (obj2.type) {
                case "shape":
                case "line": {
                    return isOverlapped(obj2, obj1);
                }
                case "point": {
                    return obj1.x === obj2.x && obj1.y === obj2.y;
                }
            }
            break;
        }
    }
}

const LOCAL_STORAGE_KEY = "LocalCanvasStateStore.state.page";

export async function initializeCanvasStateStore(): Promise<CanvasStateStore> {
    return Promise.resolve(new CanvasStateStore());
}
