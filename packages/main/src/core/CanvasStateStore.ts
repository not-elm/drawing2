import { Store } from "../lib/Store";
import type { App } from "./App";
import { LinkCollection } from "./Link";
import { Page } from "./Page";
import { PageDraft } from "./PageDraft";

export interface CanvasState {
    page: Page;
}

export class CanvasStateStore extends Store<CanvasState> {
    constructor(private readonly app: App) {
        super({
            page: new Page({
                entities: new Map(),
                entityIds: [],
                links: LinkCollection.create(),
            }),
        });
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
            this.app.unselect(entityId);
        }
        this.setPage(draft.toPage());
    }

    setPage(page: Page) {
        this.setState({ ...this.state, page });
    }
}
