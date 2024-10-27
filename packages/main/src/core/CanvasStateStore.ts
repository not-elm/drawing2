import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import type { App } from "./App";
import type { Entity } from "./Entity";
import { LinkCollection } from "./Link";
import { Page } from "./Page";
import { PageDraft } from "./PageDraft";
import { Rect } from "./geo/Rect";

export class CanvasState {
    constructor(
        readonly page: Page,
        readonly selectedEntityIds: ReadonlySet<string>,
    ) {}

    getSelectedEntities(): Entity[] {
        return Array.from(this.selectedEntityIds).map((id) => {
            const entity = this.page.entities.get(id);
            assert(entity !== undefined, `Entity ${id} not found`);
            return entity;
        });
    }

    getSelectionRect(): Rect | null {
        const selectedEntities = this.getSelectedEntities();
        if (selectedEntities.length === 0) return null;

        return Rect.union(
            selectedEntities.map((entity) => entity.getBoundingRect()),
        );
    }
}

export class CanvasStateStore extends Store<CanvasState> {
    constructor(private readonly app: App) {
        super(
            new CanvasState(
                new Page({
                    entities: new Map(),
                    entityIds: [],
                    links: LinkCollection.create(),
                }),
                new Set(),
            ),
        );
    }

    /**
     * @internal Exposed only for history rollback
     */
    setState(newState: CanvasState) {
        super.setState(newState);
    }

    edit(updater: (draft: PageDraft) => void) {
        const draft = new PageDraft(this.state.page);
        updater(draft);
        for (const entityId of draft.deletedEntityIds) {
            this.state.page.links.deleteByEntityId(entityId);
        }

        this.state.page.links.apply(draft);
        for (const entityId of draft.deletedEntityIds) {
            this.state.page.links.deleteByEntityId(entityId);
        }

        for (const entityId of draft.deletedEntityIds) {
            this.app.canvasStateStore.unselect(entityId);
        }
        this.setPage(draft.toPage());
    }

    setPage(page: Page) {
        this.setState(new CanvasState(page, this.state.selectedEntityIds));
    }

    select(entityId: string) {
        const entityIds = new Set(this.state.selectedEntityIds);
        entityIds.add(entityId);
        this.setState(new CanvasState(this.state.page, entityIds));
    }

    unselect(entityId: string) {
        const entityIds = new Set(this.state.selectedEntityIds);
        if (!entityIds.has(entityId)) return;
        entityIds.delete(entityId);
        this.setState(new CanvasState(this.state.page, entityIds));
    }

    selectAll() {
        return this.setState(
            new CanvasState(
                this.state.page,
                new Set(this.state.page.entityIds),
            ),
        );
    }

    unselectAll() {
        this.setState(new CanvasState(this.state.page, new Set()));
    }

    setSelectedEntityIds(entityIds: Iterable<string>) {
        this.setState(new CanvasState(this.state.page, new Set(entityIds)));
    }
}
