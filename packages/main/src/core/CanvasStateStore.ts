import { Store } from "../lib/Store";
import { assert } from "../lib/assert";
import { dataclass } from "../lib/dataclass";
import { Rect } from "../lib/geo/Rect";
import type { ClipboardService } from "./ClipboardService";
import type { Entity } from "./Entity";
import { LinkCollection } from "./Link";
import { Page } from "./Page";
import { PageDraft } from "./PageDraft";

export class CanvasState extends dataclass<{
    readonly page: Page;
    readonly selectedEntityIds: Set<string>;
}>() {
    getSelectionRect(): Rect | null {
        const rects = this.getSelectedEntities().map((entity) =>
            entity.getBoundingRect(),
        );
        if (rects.length === 0) return null;
        return Rect.union(rects);
    }

    getSelectedEntities(): Entity[] {
        return [...this.selectedEntityIds].map((id) => {
            const entity = this.page.entities.get(id);
            assert(entity !== undefined, `Entity ${id} not found`);

            return entity;
        });
    }

    isSelectedOnly(entityId: string): boolean {
        return (
            this.selectedEntityIds.size === 1 &&
            this.selectedEntityIds.has(entityId)
        );
    }
}

export class CanvasStateStore extends Store<CanvasState> {
    constructor(private readonly clipboardService: ClipboardService) {
        super(
            new CanvasState({
                page: new Page({
                    entities: new Map(),
                    entityIds: [],
                    links: LinkCollection.create(),
                }),
                selectedEntityIds: new Set(),
            }),
        );
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

        this.setPage(draft.toPage());
    }

    setPage(page: Page) {
        this.setState(
            this.state.copy({
                page,
                selectedEntityIds: new Set(
                    [...this.state.selectedEntityIds].filter((id) =>
                        page.entities.has(id),
                    ),
                ),
            }),
        );
    }

    deleteSelectedEntities() {
        if (this.state.selectedEntityIds.size === 0) return;

        this.edit((draft) => {
            draft.deleteEntities(this.state.selectedEntityIds);
        });
    }

    updateProperty(key: string, value: unknown) {
        this.edit((draft) => {
            draft.updateProperty([...this.state.selectedEntityIds], key, value);
        });
    }

    // Ordering

    bringToFront() {
        if (this.state.selectedEntityIds.size === 0) return;

        this.edit((draft) => draft.bringToFront(this.state.selectedEntityIds));
    }

    bringForward() {
        if (this.state.selectedEntityIds.size === 0) return;

        this.edit((draft) => draft.bringForward(this.state.selectedEntityIds));
    }

    sendBackward() {
        if (this.state.selectedEntityIds.size === 0) return;

        this.edit((draft) => draft.sendBackward(this.state.selectedEntityIds));
    }

    sendToBack() {
        if (this.state.selectedEntityIds.size === 0) return;

        this.edit((draft) => draft.sendToBack(this.state.selectedEntityIds));
    }

    // Selection

    select(id: string) {
        if (this.state.selectedEntityIds.has(id)) {
            return this;
        }

        const selectedEntityIds = new Set(this.state.selectedEntityIds);
        selectedEntityIds.add(id);

        return this.setState(this.state.copy({ selectedEntityIds }));
    }

    unselect(id: string) {
        const selectedEntityIds = new Set(this.state.selectedEntityIds);
        selectedEntityIds.delete(id);

        this.setState(this.state.copy({ selectedEntityIds }));
    }

    selectAll() {
        this.setState(
            this.state.copy({
                selectedEntityIds: new Set(this.state.page.entityIds),
            }),
        );
    }

    unselectAll() {
        this.setState(
            this.state.copy({
                selectedEntityIds: new Set(),
            }),
        );
    }

    setSelectedEntityIds(ids: Iterable<string>) {
        this.setState(this.state.copy({ selectedEntityIds: new Set(ids) }));
    }

    // Clipboard

    copy() {
        if (this.state.selectedEntityIds.size === 0) return;

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
        const { entities } = await this.clipboardService.paste();

        this.edit((draft) => {
            draft.setEntities(entities);
            // draft.addDependencies(dependencies);
        });
        this.setSelectedEntityIds(entities.map((entity) => entity.props.id));

        // Copy pasted entities so that next paste operation will
        // create a new copy of entities in different position
        this.copy();
    }
}
