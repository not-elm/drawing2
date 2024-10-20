import { Store } from "../lib/Store";
import type { App } from "./App";
import { LinkCollection } from "./Link";
import { Page } from "./Page";
import { PageDraft } from "./PageDraft";

export class CanvasStateStore extends Store<Page> {
    constructor(private readonly app: App) {
        super(
            new Page({
                entities: new Map(),
                entityIds: [],
                links: LinkCollection.create(),
            }),
        );
    }

    edit(updater: (draft: PageDraft) => void) {
        const draft = new PageDraft(this.state);
        updater(draft);
        for (const entityId of draft.deletedEntityIds) {
            this.state.links.deleteByEntityId(entityId);
        }

        this.state.links.apply(draft);
        for (const entityId of draft.deletedEntityIds) {
            this.state.links.deleteByEntityId(entityId);
        }

        for (const entityId of draft.deletedEntityIds) {
            this.app.unselect(entityId);
        }
        this.setPage(draft.toPage());
    }

    setPage(page: Page) {
        this.setState(page);
    }
}
