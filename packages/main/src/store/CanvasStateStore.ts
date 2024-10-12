import { isLineOverlapWithLine } from "../geo/Line";
import { isRectOverlapWithLine, isRectOverlapWithRect } from "../geo/Rect";
import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { CanvasState } from "../model/CanvasState";
import type { ColorId } from "../model/Colors";
import { DependencyCollection } from "../model/DependencyCollection";
import type { FillMode } from "../model/FillMode";
import { type Entity, type Page, getEdgesFromPath } from "../model/Page";
import {
    type SerializedPage,
    deserializePage,
    serializePage,
} from "../model/SerializedPage";
import type { StrokeStyle } from "../model/StrokeStyle";
import type { TextAlignment } from "../model/TextAlignment";
import type { TextEntitySizingMode } from "../model/TextEntitySizingMode";
import { Transaction } from "../model/Transaction";
import type { Viewport } from "../model/Viewport";
import { ClipboardService } from "../service/ClipboardService";

export class CanvasStateStore extends Store<CanvasState> {
    constructor() {
        super(
            new CanvasState({
                page: {
                    entities: {},
                    entityIds: [],
                    dependencies: new DependencyCollection(),
                },
                selectedEntityIds: [],
            }),
        );

        this.loadFromLocalStorage();

        setInterval(() => {
            this.saveToLocalStorage();
        }, 1000);
    }

    deleteEntity(entityIds: string[]) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .deleteEntities(entityIds)
                    .commit(),
            ),
        );
    }

    deleteSelectedEntities() {
        this.deleteEntity(this.state.selectedEntityIds);
    }

    updateZIndex(currentIndex: number, newIndex: number) {
        const newEntityIds = this.state.page.entityIds.slice();
        const [id] = newEntityIds.splice(currentIndex, 1);
        newEntityIds.splice(newIndex, 0, id);

        this.setState(
            this.state.setPage({
                ...this.state.page,
                entityIds: newEntityIds,
            }),
        );
    }

    // Command or Pageをスタックで管理
    undo() {}

    redo() {}

    setLabel(id: string, label: string) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty([id], (oldEntity) => {
                        switch (oldEntity.type) {
                            case "shape": {
                                return { ...oldEntity, label };
                            }
                            case "text": {
                                return { ...oldEntity, content: label };
                            }
                            default: {
                                assert(
                                    false,
                                    `Invalid entity type: ${oldEntity.id} ${oldEntity.type}`,
                                );
                            }
                        }
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
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "shape": {
                                    return {
                                        ...oldEntity,
                                        textAlignX,
                                        textAlignY,
                                    };
                                }
                                case "text": {
                                    return {
                                        ...oldEntity,
                                        textAlignment: textAlignX,
                                    };
                                }
                                default: {
                                    return oldEntity;
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
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "shape":
                                case "path": {
                                    return { ...oldEntity, colorId };
                                }
                                default: {
                                    return oldEntity;
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
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "shape": {
                                    return { ...oldEntity, fillMode };
                                }
                                default: {
                                    return oldEntity;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    setLineEndType(lineEnd: 1 | 2, lineEndType: LineEndType) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "path": {
                                    return {
                                        ...oldEntity,
                                        [`endType${lineEnd}`]: lineEndType,
                                    };
                                }
                                default: {
                                    return oldEntity;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    setTextEntityTextAlignment(alignment: TextAlignment) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "text": {
                                    return {
                                        ...oldEntity,
                                        textAlignment: alignment,
                                    };
                                }
                                default: {
                                    return oldEntity;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    setTextEntitySizingMode(sizingMode: TextEntitySizingMode) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "text": {
                                    return {
                                        ...oldEntity,
                                        sizingMode,
                                    };
                                }
                                default: {
                                    return oldEntity;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    setStrokeStyle(strokeStyle: StrokeStyle) {
        this.setState(
            this.state.setPage(
                new Transaction(this.state.page)
                    .updateProperty(
                        this.state.selectedEntityIds,
                        (oldEntity) => {
                            switch (oldEntity.type) {
                                case "shape":
                                case "path": {
                                    return {
                                        ...oldEntity,
                                        strokeStyle,
                                    };
                                }
                                default: {
                                    return oldEntity;
                                }
                            }
                        },
                    )
                    .commit(),
            ),
        );
    }

    bringToFront() {
        this.bringForwardOf(this.state.page.entityIds.length - 1);
    }

    bringForward() {
        const selectedIdSet = new Set(this.state.selectedEntityIds);

        let mostBackwardResult = null;
        for (const selectedId of selectedIdSet) {
            const result = this.findForwardOverlappedEntity(
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
            // selected entities are already at the front
            return;
        }

        this.bringForwardOf(mostBackwardResult.globalIndex);
    }

    sendToBack() {
        this.sendBackwardOf(0);
    }

    sendBackward() {
        const selectedIdSet = new Set(this.state.selectedEntityIds);

        let mostForwardResult = null;
        for (const selectedId of selectedIdSet) {
            const result = this.findBackwardOverlappedEntity(
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
            // selected entities are already at the front
            return;
        }

        this.sendBackwardOf(mostForwardResult.globalIndex);
    }

    /**
     * Update the z-index of the selected entities to bring them
     * forward of the target entity
     * @param targetZIndex
     */
    private bringForwardOf(targetZIndex: number) {
        const selectedIdSet = new Set(this.state.selectedEntityIds);

        // Current z-index of selected entities
        const currentIndices = [];
        for (let i = 0; i < this.state.page.entityIds.length; i++) {
            if (selectedIdSet.has(this.state.page.entityIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices.toReversed()) {
            if (currentIndex >= targetZIndex) continue;

            this.updateZIndex(currentIndex, targetZIndex);
            targetZIndex -= 1;
        }
    }

    /**
     * Update the z-index of the selected entities to send them
     * backward of the target entity
     */
    private sendBackwardOf(targetZIndex: number) {
        const selectedIdSet = new Set(this.state.selectedEntityIds);

        // Current z-index of selected entities
        const currentIndices = [];
        for (let i = 0; i < this.state.page.entityIds.length; i++) {
            if (selectedIdSet.has(this.state.page.entityIds[i])) {
                currentIndices.push(i);
            }
        }

        for (const currentIndex of currentIndices) {
            if (currentIndex <= targetZIndex) continue;

            this.updateZIndex(currentIndex, targetZIndex);
            targetZIndex += 1;
        }
    }

    /**
     * Find the overlapped entity with the given entity from the entities
     * located in front of it, and return the most-backward entity.
     */
    private findForwardOverlappedEntity(
        entityId: string,
        ignoreEntityIds: Set<string>,
    ): { entityId: string; globalIndex: number } | null {
        let globalIndex = 0;
        for (; globalIndex < this.state.page.entityIds.length; globalIndex++) {
            if (this.state.page.entityIds[globalIndex] === entityId) break;
        }

        const refEntity = this.state.page.entities[entityId];
        assert(refEntity !== undefined, "Cannot find the reference entity");
        globalIndex++;

        for (; globalIndex < this.state.page.entityIds.length; globalIndex++) {
            const entityId = this.state.page.entityIds[globalIndex];
            if (ignoreEntityIds.has(entityId)) {
                continue;
            }

            const otherEntity = this.state.page.entities[entityId];

            if (otherEntity === undefined) continue;

            if (isOverlapped(refEntity, otherEntity)) {
                return { entityId: entityId, globalIndex };
            }
        }

        return null;
    }

    /**
     * Find the overlapped entity with the given entity from the entities
     * located behind of it, and return the most-forward entity.
     */
    private findBackwardOverlappedEntity(
        entityId: string,
        ignoreEntityIds: Set<string>,
    ): { entityId: string; globalIndex: number } | null {
        let globalIndex = this.state.page.entityIds.length - 1;
        for (; globalIndex >= 0; globalIndex--) {
            if (this.state.page.entityIds[globalIndex] === entityId) break;
        }

        const refEntity = this.state.page.entities[entityId];
        assert(refEntity !== undefined, "Cannot find the reference entity");
        globalIndex--;

        for (; globalIndex >= 0; globalIndex--) {
            const entityId = this.state.page.entityIds[globalIndex];
            if (ignoreEntityIds.has(entityId)) {
                continue;
            }

            const otherEntity = this.state.page.entities[entityId];

            if (otherEntity === undefined) continue;

            if (isOverlapped(refEntity, otherEntity)) {
                return { entityId: entityId, globalIndex };
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
        if (this.state.selectedEntityIds.includes(id)) {
            this.unselect(id);
        } else {
            this.select(id);
        }
    }

    setSelectedEntityIds(ids: string[]) {
        this.setState(this.state.setSelectedEntityIds(ids));
    }

    copy() {
        if (this.state.selectedEntityIds.length === 0) return;

        ClipboardService.copy(this.state.page, this.state.selectedEntityIds);
    }

    async cut() {
        this.copy();
        this.deleteSelectedEntities();
    }

    async paste(): Promise<void> {
        const { entities, dependencies } = await ClipboardService.paste();

        this.setState(
            this.state
                .setPage(
                    new Transaction(this.state.page)
                        .insertEntities(entities)
                        .addDependencies(dependencies)
                        .commit(),
                )
                .setSelectedEntityIds(entities.map((entity) => entity.id)),
        );

        // Copy pasted entities so that next paste operation will
        // create a new copy of entities in different position
        this.copy();
    }

    private saveToLocalStorage() {
        const serializedPage = serializePage(this.state.page);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializedPage));
    }

    private loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (data === null) return;

            const serializedPage: SerializedPage = JSON.parse(data);
            const page = deserializePage(serializedPage);

            this.setState(this.state.setPage(page).unselectAll());
        } catch {}
    }

    protected setState(newState: CanvasState) {
        super.setState(newState);
    }
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

export function isOverlapped(obj1: Entity, obj2: Entity): boolean {
    switch (obj1.type) {
        case "shape":
        case "text": {
            switch (obj2.type) {
                case "shape":
                case "text": {
                    return isRectOverlapWithRect(obj1, obj2);
                }
                case "path": {
                    return getEdgesFromPath(obj2).some((line) =>
                        isRectOverlapWithLine(obj1, line),
                    );
                }
            }
            break;
        }
        case "path": {
            switch (obj2.type) {
                case "shape":
                case "text": {
                    return isOverlapped(obj2, obj1);
                }
                case "path": {
                    const lines1 = getEdgesFromPath(obj2);
                    const lines2 = getEdgesFromPath(obj2);

                    return lines1.some((line1) =>
                        lines2.some((line2) =>
                            isLineOverlapWithLine(line1, line2),
                        ),
                    );
                }
            }
            break;
        }
    }
}

const LOCAL_STORAGE_KEY = "LocalCanvasStateStore.state.page";
