import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { Point } from "../lib/geo/Point";
import type { ClipboardService } from "./ClipboardService";
import type { EntityHandleMap } from "./EntityHandleMap";
import { CanvasState } from "./model/CanvasState";
import { DependencyCollection } from "./model/DependencyCollection";
import type { Page } from "./model/Page";
import {
    type SerializedPage,
    deserializePage,
    serializePage,
} from "./model/SerializedPage";
import type { TextEntitySizingMode } from "./model/TextEntitySizingMode";
import { Transaction } from "./model/Transaction";
import type { Viewport } from "./model/Viewport";

export class CanvasStateStore extends Store<CanvasState> {
    constructor(
        private readonly handle: EntityHandleMap,
        private readonly clipboardService: ClipboardService,
    ) {
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
        this.edit((tx) => tx.deleteEntities(entityIds));
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

    edit(updater: (tx: Transaction) => void) {
        const tx = new Transaction(this.state.page);
        updater(tx);
        this.setPage(tx.commit(this.handle));
    }

    setContent(content: string) {
        this.edit((tx) => {
            tx.updateProperty(this.state.selectedEntityIds, "content", content);
        });
    }

    setTextEntitySizingMode(sizingMode: TextEntitySizingMode) {
        this.edit((tx) => {
            tx.updateProperty(
                this.state.selectedEntityIds,
                "sizingMode",
                sizingMode,
            );
        });
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

            if (this.handle.isOverlapWithEntity(refEntity, otherEntity)) {
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

            if (this.handle.isOverlapWithEntity(refEntity, otherEntity)) {
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

    setSelectedEntityIds(ids: string[]) {
        this.setState(this.state.setSelectedEntityIds(ids));
    }

    copy() {
        if (this.state.selectedEntityIds.length === 0) return;

        this.clipboardService.copy(
            this.state.page,
            this.state.selectedEntityIds,
        );
    }

    async cut() {
        this.copy();
        this.deleteSelectedEntities();
    }

    async paste(): Promise<void> {
        const { entities, dependencies } = await this.clipboardService.paste();

        this.edit((tx) => {
            tx.insertEntities(entities).addDependencies(dependencies);
        });
        this.setSelectedEntityIds(entities.map((entity) => entity.id));

        // Copy pasted entities so that next paste operation will
        // create a new copy of entities in different position
        this.copy();
    }

    private saveToLocalStorage() {
        const serializedPage = serializePage(this.state.page, this.handle);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializedPage));
    }

    private loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (data === null) return;

            const serializedPage: SerializedPage = JSON.parse(data);
            const page = deserializePage(serializedPage, this.handle);

            this.setState(this.state.setPage(page).unselectAll());
        } catch {}
    }
}

export function fromCanvasCoordinate(
    canvasX: number,
    canvasY: number,
    viewport: Viewport,
): Point {
    return new Point(
        canvasX / viewport.scale + viewport.rect.left,
        canvasY / viewport.scale + viewport.rect.top,
    );
}

const LOCAL_STORAGE_KEY = "LocalCanvasStateStore.state.page";
