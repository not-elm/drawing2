import { isLineOverlapWithLine, isLineOverlapWithPoint } from "../geo/Line";
import {
    isRectOverlapWithLine,
    isRectOverlapWithPoint,
    isRectOverlapWithRect,
} from "../geo/Rect";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { CanvasState } from "../model/CanvasState";
import type { ColorId } from "../model/Colors";
import { DependencyCollection } from "../model/DependencyCollection";
import type { FillMode } from "../model/FillMode";
import type { Obj, Page } from "../model/Page";
import type { TextAlignment } from "../model/TextAlignment";
import { Transaction } from "../model/Transaction";
import type { Viewport } from "../model/Viewport";

export class CanvasStateStore extends Store<CanvasState> {
    constructor() {
        super(
            new CanvasState({
                page: {
                    objects: {},
                    objectIds: [],
                    dependencies: new DependencyCollection(),
                },
                selectedObjectIds: [],
            }),
        );

        // this.loadFromLocalStorage();
        //
        // setInterval(() => {
        // 	this.saveToLocalStorage();
        // }, 1000);
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

    setPage(page: Page) {
        this.setState(this.state.setPage(page));
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

    setSelectedObjectIds(ids: string[]) {
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

    // setState(state: CanvasState) {
    //     super.setState(state);
    //     console.log(state);
    //     // this.saveToLocalStorage();
    // }
}

export const MouseButton = {
    Left: 0,
    Middle: 1,
    Right: 2,
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
