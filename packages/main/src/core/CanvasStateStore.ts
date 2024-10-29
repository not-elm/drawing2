import { assert } from "../lib/assert";
import type { App } from "./App";
import { LinkCollection } from "./Link";
import { Page } from "./Page";
import { PageDraft } from "./PageDraft";

import type { SelectedEntityChangeEvent } from "./ModeController";
import { atom, derived } from "./atom/Atom";
import { Rect } from "./shape/Shape";

export class CanvasStateStore {
    public readonly page = atom(
        new Page({
            entities: new Map(),
            entityIds: [],
            links: LinkCollection.create(),
        }),
    );

    public readonly selectedEntityIds = atom<ReadonlySet<string>>(new Set());

    public readonly selectedEntities = derived(() => {
        return Array.from(this.selectedEntityIds.get()).map((id) => {
            const entity = this.page.get().entities.get(id);
            assert(entity !== undefined, `Entity ${id} not found`);
            return entity;
        });
    });

    public readonly selectionRect = derived(() => {
        const selectedEntities = this.selectedEntities.get();
        if (selectedEntities.length === 0) return null;

        return Rect.union(
            selectedEntities.map((entity) =>
                entity.getShape().getBoundingRect(),
            ),
        );
    });

    constructor(private readonly app: App) {}

    edit(updater: (draft: PageDraft) => void) {
        const draft = new PageDraft(this.page.get());
        updater(draft);
        for (const entityId of draft.deletedEntityIds) {
            this.page.get().links.deleteByEntityId(entityId);
        }

        this.page.get().links.apply(draft);
        for (const entityId of draft.deletedEntityIds) {
            this.page.get().links.deleteByEntityId(entityId);
        }

        for (const entityId of draft.deletedEntityIds) {
            this.app.canvasStateStore.unselect(entityId);
        }
        this.setPage(draft.toPage());
    }

    setPage(page: Page) {
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
