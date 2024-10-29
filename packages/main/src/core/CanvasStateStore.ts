import { assert } from "../lib/assert";
import type { App } from "./App";
import { LinkCollection } from "./Link";
import type { SelectedEntityChangeEvent } from "./ModeController";
import { Page } from "./Page";
import { PageBuilder } from "./PageBuilder";
import { cell, derived } from "./cell/ICell";
import { Rect } from "./shape/Shape";

export class CanvasStateStore {
    public readonly page = cell(
        new Page({
            entities: new Map(),
            entityIds: [],
            links: LinkCollection.create(),
        }),
    );

    public readonly selectedEntityIds = cell<ReadonlySet<string>>(new Set());

    public readonly selectedEntities = derived(() => {
        const page = this.page.get();
        const selectedEntityIds = this.selectedEntityIds.get();

        return Array.from(selectedEntityIds).map((id) => {
            const entity = page.entities.get(id);
            assert(entity !== undefined, `Entity ${id} not found`);
            return entity;
        });
    }, "selectedEntities");

    public readonly selectionRect = derived(() => {
        const selectedEntities = this.selectedEntities.get();

        if (selectedEntities.length === 0) return null;
        return Rect.union(
            selectedEntities.map((entity) =>
                this.app.entityHandle.getShape(entity).getBoundingRect(),
            ),
        );
    }, "selectionRect");

    constructor(private readonly app: App) {}

    edit(updater: (builder: PageBuilder) => void) {
        const builder = new PageBuilder(this.page.get(), this.app.entityHandle);
        updater(builder);
        for (const entityId of builder.deletedEntityIds) {
            this.page.get().links.deleteByEntityId(entityId);
        }

        this.page.get().links.apply(builder, this.app.entityHandle);
        for (const entityId of builder.deletedEntityIds) {
            this.page.get().links.deleteByEntityId(entityId);
        }

        for (const entityId of builder.deletedEntityIds) {
            this.app.canvas.unselect(entityId);
        }
        this.setPage(builder.build());
    }

    setPage(page: Page) {
        const selectedEntities = new Set(
            [...this.selectedEntityIds.get()].filter((id) =>
                page.entities.has(id),
            ),
        );
        this.selectedEntityIds.set(selectedEntities);
        this.page.set(page);
    }

    select(entityId: string) {
        const entityIds = new Set(this.selectedEntityIds.get());
        entityIds.add(entityId);
        this.setSelectedEntityIds(entityIds);
    }

    unselect(entityId: string) {
        const entityIds = new Set(this.selectedEntityIds.get());
        if (!entityIds.has(entityId)) return;
        entityIds.delete(entityId);
        this.setSelectedEntityIds(entityIds);
    }

    selectAll() {
        this.setSelectedEntityIds(new Set(this.page.get().entityIds));
    }

    unselectAll() {
        this.setSelectedEntityIds(new Set());
    }

    setSelectedEntityIds(entityIds: Iterable<string>) {
        const ev: SelectedEntityChangeEvent = {
            oldSelectedEntityIds: this.selectedEntityIds.get(),
            newSelectedEntityIds: new Set(entityIds),
        };

        this.app
            .getModeController()
            .onBeforeSelectedEntitiesChange(this.app, ev);
        this.selectedEntityIds.set(ev.newSelectedEntityIds);
        this.app
            .getModeController()
            .onAfterSelectedEntitiesChange(this.app, ev);
    }
}
